# 视频视差 + 星尘扩散方案

## 交互流程

滚轮总行程分成两段：
- **0% → 60%**：视频进度（`currentTime` 跟随滚轮，已有）+ 新增缩放视差
- **60% → 100%**：视频停在最后一帧，星尘粒子从两指相接点扩散
- **100% 到达时**：整层淡出到黑，触发进入手部阶段

反向滚动完全可逆（星尘回缩、视频倒放），保证操作手感一致。

## 具体实现

### 1. 视频视差（`IntroVideo.tsx`）
在现有 wheel 累加逻辑上派生 `scrollProgress`（0–1）：
- 视频阶段进度 `videoP = clamp(scrollProgress / 0.6, 0, 1)`，仍驱动 `currentTime`
- 前景 `<video>` 应用 `transform: scale(1 + videoP * 0.05)`（围绕两指中心，`transform-origin` 设为 50% 50% 对应容器内 UV）
- 模糊背景保持 cover 不动，避免视觉抖动
- 用 `requestAnimationFrame` 直接写 `style.transform`，不走 React state

### 2. 星尘扩散层（新增 `StardustBurst.tsx`）
一个覆盖全屏的 `<canvas>`，`z-index: 65`（视频之上，手部/wordmark 之下）：

- **粒子系统**：Canvas 2D，200–400 个粒子；每颗记录 `{angle, radius, speed, size, twinkle}`
- **驱动**：外部传入 `burstProgress`（0–1，来自 `(scrollProgress - 0.6) / 0.4`）
- **半径映射**：`r = easeOutCubic(burstProgress) * maxR`，`maxR = viewport 对角线`
- **中心点**：两指相接点，由父组件按 contain 视频尺寸算出 `{cx, cy}` 传入
- **视觉**：白色 sprite（预渲染带柔光的圆点 + 十字光芒），`globalCompositeOperation = 'lighter'` 叠加
- **闪烁**：每颗按 `sin(time * freq + phase)` 调 alpha，重现 Shopify shader 中 `sin(uTime + uv.x*10)` 的活体感
- **暗部**：在粒子层下叠一层由中心向外扩张的黑色径向蒙版（`radial-gradient` DOM 层），提供 Shopify 参考中"有机黑洞"的底色
- **可逆**：`burstProgress` 减小时半径回缩、粒子透明度下降，无硬切

### 3. 终态淡出（`AsciiHandsFooter.tsx`）
- `scrollProgress >= 1` 持续 ~200ms → `setStage('hands')`
- 星尘层在切换瞬间 opacity 过渡到 0（400ms），同时背景已切黑
- 手部生长动画照常触发

### 4. 状态机改动
`AsciiHandsFooter.tsx`：
- 保留现有 `stage: 'video' | 'hands'`
- 从 `IntroVideo` 提升 `scrollProgress` 到 footer，透传给 `StardustBurst`
- 视频完成条件从"currentTime 到末尾"改为"scrollProgress >= 1"

## 技术细节

- 粒子 sprite 通过 `OffscreenCanvas` 预烘焙，运行时 `drawImage` 无逐帧渲染成本
- `prefers-reduced-motion` → 跳过粒子，直接淡黑过渡
- 粒子数按 `devicePixelRatio` 与视口面积自适应（低端设备减半）
- 复用现有 wheel 累加器，不新增滚动库

## 不改动的部分

- 手部 ASCII、hover 破碎、点击马赛克、球体（已移除）逻辑不动
- 视频源与模糊背景 contain 布局不动
- 颜色体系（#C5A9FF 紫）不动