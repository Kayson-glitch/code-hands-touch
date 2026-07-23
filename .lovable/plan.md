## 目标

给扩散动画的边缘光圈（core rim / hot halo 区）叠加一层与页面 GlitchGrainOverlay 视觉一致的故障风效果，让扩散阶段的边缘与后续界面的删格 / 噪点风格统一。其他一切不变（扩散形状、时序、颜色、时长、参数、handoff 逻辑均不动）。

## 只改一个文件

**`src/components/IntroVideo.tsx`** 的片段着色器（约 315–336 行 burn edge 合成段），只在 `outside * env` 边缘带内叠加故障扰动，不影响：
- 已烧穿的黑色 hole (`burned` 区域)
- 扩散外部未触及的视频画面
- 现有 L0/L1/L2/L3 光晕层的强度与颜色

## 具体改动（着色器内，纯 GLSL）

在现有 4 层光晕合成之后、`col = col - max(...)` 之前，新增一段"edge glitch"，作用范围严格约束在边缘一条窄带 `edgeBand = smoothstep(0.09, 0.0, abs(d)) * outside * env`：

1. **扫描线（scanline）**：`sin(gl_FragCoord.y * ~1.6 + t * ~4.0)` 在边缘带上做 ±8% 亮度调制，与 `GlitchGrainOverlay` 的横向扫描线呼应
2. **RGB 错位（chroma split）**：沿边缘法线方向对已合成的 `col` 做 ~0.6–1.2px 的 R/B 通道位移，只在 `edgeBand` 内混入
3. **块状抖动（block jitter）**：用 `floor(gl_FragCoord.xy / vec2(6.0, 2.0))` 做低频哈希，每几帧触发一次横向 1–2px 位移，概率 ~15%，只叠在边缘带
4. **高频噪点（grain）**：现有 `L3` 已经有 grain，但只作用在外部雾气；这里在边缘核心带再加一层 ±4% 的 hash 噪点

所有 4 个子效果通过一个总强度 `edgeBand` 门控，`b`（burn 进度）在 <0.02 或 >0.94 时自然衰减，与现有 `env` 一致。

## 不做的事

- 不新增 uniform、不加 Debug Panel 参数（保持"其他不变"）
- 不修改 JS 侧任何逻辑（时序、handoff、scroll driver 全部不动）
- 不改 `GlitchGrainOverlay` 组件本身
- 不改 hole 内部（保持纯黑）
- 不改光晕 4 层的颜色与叠加公式

## 验证

改完后用 Playwright 触发扩散，截图边缘带 3 帧（b≈0.3 / 0.6 / 0.9），确认：
- 边缘出现扫描线 + RGB 错位 + 块状抖动
- 黑色 hole 内部仍纯黑
- 扩散外部视频区域无变化
- 与后续第一屏 `GlitchGrainOverlay` 视觉连贯
