## 目标
在点击展开/收回马赛克动画期间，球体始终位于所有元素之上，且不拦截手部的 hover/click 交互。

## 现状检查
- `section` 是 `relative overflow-hidden`，形成堆叠上下文。
- 背景 wordmark 容器：`absolute`，无 `z-index` → 默认 0。
- ASCII `<canvas>`：`absolute inset-0`，无 `z-index` → 默认 0，但因 DOM 顺序在 wordmark 之后而覆盖它；点击/hover 事件由它接收。
- 球体容器：`absolute` + `zIndex: 50` + `pointer-events-none`，DOM 顺序最后。

理论上球体已在最上层，但没有显式给 canvas 和 wordmark 分配 z-index，展开动画期间任何后续新增元素或第三方浮层都可能意外遮挡；同时应确保球体内部 R3F Canvas 也不吃事件。

## 调整方案（仅调层级/事件，不动动画逻辑）

**`src/components/AsciiHandsFooter.tsx`**
- Wordmark 容器：追加 `style={{ zIndex: 0 }}`。
- ASCII `<canvas>`：追加 `style={{ zIndex: 10 }}`（保持接收 hover/click）。
- 球体容器：`zIndex` 由 50 提升为 `zIndex: 60`，并保留 `pointer-events-none`；再补一个 `style={{ isolation: "isolate" }}` 避免子级 Canvas 产生新的堆叠意外。

**`src/components/LiquidMetalOrb.tsx`**
- `<Canvas>` 的 `style` 已包含 `pointerEvents: "none"`，再补 `touchAction: "none"`，彻底避免移动端手势拦截。

## 验证
- 展开/收回动画播放中，球体始终清晰可见、不被马赛克 tile 覆盖。
- 手部 hover 破碎效果、单击锁定/再次单击收回均正常触发。
- DevTools Elements 面板中球体容器 z-index = 60，canvas = 10，wordmark = 0。
