## 现状核对

- 之前把 `GlitchGrainOverlay` 从全局根节点搬进了 `AsciiHandsFooter`（仅第一屏 fixed hero 容器内），所以第二屏 `SloganSection` 就没有扫描线了。
- 当前 `src/components/SloganSection.tsx` 的 `<section>` 只有纯 `#000` 背景，没有任何扫描线层。
- 这是之前按你要求"扫描线只在第一屏背景层"调整后的副作用，并非新的擅自修改。

## 方案

在 `src/components/SloganSection.tsx` 内部，紧贴 `<section>` 背景加一层与第一屏一致的扫描线：

- 在 sticky 内容层之前插入一个 `GlitchGrainOverlay`（`intensity="low"`, `visible`），或直接用等效的 `repeating-linear-gradient` div。
- 定位：`position: absolute; inset: 0; pointer-events: none; z-index: 0`（内容层保持默认 / 更高层级，文字不受影响）。
- 保持与第一屏相同的参数：`rgba(255,255,255,0.055)`，`0 1px / 1px 3px` 的重复线性渐变，无 `mix-blend-mode`，纯叠加在 `#000` 上，视觉与 hero 一致。
- 不改动 `IntroVideo` 内的扫描线（那一层是开场视频专用的 overlay 混合模式，保持独立）。

## 验证

- 滚动到第二屏：文字背景可见与第一屏一致的横向扫描线。
- 第一屏 / 开场视频 / 扩散阶段不受影响。
- 文字点击、hover 无异常（overlay `pointer-events: none`）。
