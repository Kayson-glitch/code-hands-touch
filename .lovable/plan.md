## 目标
参考上传视频（两只手臂分别从画面左右两侧缓慢伸入、指尖在画面中部即将相触），为现有 ASCII 手臂场景添加一次**入场动效**：初始画面为空，随后左右两条手臂以 ASCII glyph 的形式沿手臂骨架方向从边缘"生长"到位；完成后回落到当前 hover 交互模式。

## 交互与时序
- **触发时机**：组件挂载后（下次首次可见即可，避免滚动出视口重复播放）。使用 `IntersectionObserver` 只播一次。
- **总时长**：约 1600 ms（`prefers-reduced-motion` 时降为 0，直接展示成品）。
- **阶段**：
  1. 0–1400 ms：`revealProgress` 从 0 线性/eased 增长到 1，左右手臂各自沿手臂主轴由外向内逐格显影。
  2. 1400–1600 ms：短暂的"到位"抖动（幅度极小的 sinusoidal settle），随后停止。
- 入场结束后，hover reveal disc / parallax / scramble 全部照常工作；入场期间禁用 hover disc 以避免视觉冲突。

## 视觉规则
- 每个 cell 根据其"沿手臂轴"的投影位置获得一个 0..1 的 `cellT`（0 = 手臂根部/画面边缘，1 = 指尖/画面中部）。到达阈值前该 cell 不绘制。
- 左半侧 cells 用 `+ARM_ANGLE_DEG` 轴投影，右半侧用 `-ARM_ANGLE_DEG` 轴投影（复用现有 `ARM_ANGLE_DEG = 60` 常量与旋转公式，保证入场方向和 hover 破碎方向一致）。
- 前沿附近（`|cellT - progress| < 0.08`）叠加：
  - 亮度提升（向 `HR/HG/HB` 高光色靠近，权重 ~0.6）
  - 字符 scramble（复用现有 scramble hash，让前沿是"墨迹涌出"的乱码，而不是静止 glyph）
  - 轻微 x/y 抖动（±1 px，随 seed 抖动），营造喷溅感
- 已经"生长完毕"的 cell 恢复正常渲染，融入现有系统。

## 技术细节（`src/components/AsciiHandsFooter.tsx`）
1. 新增常量：`INTRO_DURATION_MS = 1600`, `INTRO_FRONT_WIDTH = 0.08`, `INTRO_EASE`（`t => 1 - Math.pow(1 - t, 3)` cubic-out，与视频里"先快后缓"的伸出手感一致）。
2. 新增 ref：`introStartRef`（number | null）、`introDoneRef`（boolean）、`introVisibleRef`（IntersectionObserver 触发后置 true）。
3. `resample()` 结束后，为每个 cell 预计算 `armT`：
   - `sideSign = c.x < w/2 ? 1 : -1`
   - 投影 `along = (c.x - edgeX) * cos(armRad) * sideSign + (c.y - baseY) * (-sin(armRad))`
   - 归一化到 0..1（用整张手臂投影 min/max）。将 `armT` 存到 cell 上（扩展 `Cell` 类型）。
4. 渲染循环：
   - 若 `!introDoneRef.current && introVisibleRef.current`：`progress = INTRO_EASE(clamp((now - introStart)/INTRO_DURATION_MS))`，到 1 时置 `introDoneRef = true`。
   - 若 `progress < 1`：
     - 强制 `showGooey = false`（临时关闭 hover disc）
     - 每个 cell：若 `armT > progress` → `continue`；否则 `frontDist = progress - armT`；若 `frontDist < INTRO_FRONT_WIDTH` → 施加亮度/scramble/抖动叠加。
5. IntersectionObserver 挂在 canvas 元素上，`threshold: 0.25`，进入视口设置 `introStartRef = performance.now()` 并解除观察。
6. `prefersReduce` 时直接 `introDoneRef = true`、`progress = 1`，跳过入场。

## 不改动
- 现有 hover reveal disc（radius/softness/noise）
- 动态 easing / 手臂方向噪声 / parallax / scramble tick / 字体与颜色系统
- 采样管线（`sampleImage`、grid 数据结构；仅扩展 Cell 属性一个 `armT` 字段）

## 验证
- `bun run build` 通过。
- Playwright：加载页面后立刻截图 3 帧（0.3s / 0.9s / 1.6s），确认手臂由外向内逐步显影，前沿有高光。
- 入场结束后 hover 一次，确认破碎 disc 正常工作（未被入场逻辑意外禁用）。
- 打开 `prefers-reduced-motion: reduce`，确认直接呈现完整画面无动画。
