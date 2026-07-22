## 目标
滚轮进度推到视频末尾时，两手中心"烧纸"式扩散：从实心不规则光点 → 燃烧圆环向外推进（中心烧穿露出黑色）→ 全屏烧完 → 淡入后续 UI。触发后不可逆，全程 1.6s。

## 视觉规格
- **起点**：视频中心（`uCenter`，即两手指相接处，已有）
- **形态**：不规则边缘（fbm 噪声扰动的 SDF 圆），带柔和光晕圈层（非焦黄，用冷色/淡紫叠加，与站点调性一致）
- **阶段**（burn 参数 0→1，映射 1.6s）：
  - 0.0–0.15：中心冒出实心小点（半径 0→~8% 屏幕），带轻微光晕
  - 0.15–0.75：圆环向外推进，中心逐步烧穿变黑（内半径追随外半径，环宽渐窄），环缘保留柔光叠加
  - 0.75–1.0：外缘推出屏幕，全屏变黑
- **不可逆**：一旦 burnStarted，忽略后续滚轮 delta

## 技术方案

### 1. `src/components/IntroVideo.tsx`
- **移除**：现有 burst 相关 shader 代码（rim / core / whiten / sparkle / finalWhite 那几段），它们和"烧纸"语义不符
- **新增 uniforms**：`uBurn`（0..1，由 1.6s 定时器驱动，独立于滚轮）
- **Shader 改动**（片元）：
  - 保留视频采样 + 现有 zoom 视差
  - 新增 burn 计算：
    - 外半径 `rOuter = easeOutCubic(uBurn) * 1.8`
    - 内半径 `rInner = smoothstep(0.15, 1.0, uBurn) * 1.8`（滞后于外半径，形成环）
    - fbm 扰动叠加到 `d = length(p) - r + distort`
    - 环带 `ring = smoothstep(rInner_edge, rOuter_edge, d)` 决定"仍是纸/已烧穿"
  - 输出：
    - 已烧穿区域 → `vec3(0.0)`（露出黑色底）
    - 未烧区域 → 视频颜色
    - 环缘 → 叠加淡紫柔光（`exp(-abs(d-rOuter)*k)` × 冷色）
- **JS 控制**：
  - 当 `progress >= 1` 且未触发 burn 时：`burnStartedAt = now`，`burnActive = true`
  - loop 内：`uBurn = clamp((now - burnStartedAt) / 1600, 0, 1)`
  - 滚轮监听：`if (burnActive) return`（不可逆）
  - `uBurn >= 1` 时触发 `onEnded`（当前调用 `fire()` 的时机后移到烧完之后）
  - 视频在 burn 期间锁定最后一帧（已有 lockFinalFrame 逻辑保留）

### 2. `src/routes/index.tsx`
- 现有 `IntroVideo` → 后续 UI 的切换已存在
- 增加短暂黑屏过渡：`onEnded` 触发后，先渲染纯黑 `div` 200ms，再 fade in `AsciiHandsFooter + SiteNav + HeroCopy + FinChatDock`（现有 `shown` 淡入机制沿用，只是插入一段黑幕停留）

### 3. 不改动的部分
- IntroPreloader、SiteNav、HeroCopy、FinChatDock、AsciiHandsFooter 内部逻辑
- 滚轮平滑（SMOOTH_RATE 等）在 burn 触发前完全保留
- 视频视差 zoom 保留

## 参数（可调）
```
BURN_DURATION_MS = 1600
BURN_RING_WIDTH  = 0.35   // 环带宽度（世界单位）
BURN_DISTORT     = 0.22   // fbm 边缘扰动强度
BURN_GLOW_COLOR  = vec3(0.77, 0.66, 1.00)  // 淡紫光圈
POST_BURN_BLACK_MS = 200  // 全屏烧完后黑幕停留
```

## 验证
- 构建通过
- Playwright：滚到末尾 → 截图 3 张（burn=0.3 / 0.7 / 1.0）确认环形烧穿 + 淡紫光圈 + 中心黑
- 确认 burn 触发后再滚滚轮不回退
