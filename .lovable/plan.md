## 目标
参考图是一整块近黑色底，上面覆盖着极轻的颗粒 + 细密扫描线的"故障风"底噪。给站点里所有黑底区域（视频结束后的黑幕、字符手部区域、以及页面主背景）统一叠加一层同款低强度纹理，让黑不再是纯平面。

## 方案

新增一个共享覆盖层组件 `src/components/GlitchGrainOverlay.tsx`：
- 一个 `position: fixed; inset: 0; pointer-events: none; z-index: 1;` 的层，只在"当前背景为黑"时可见。
- 两层叠加：
  1. **扫描线**：`repeating-linear-gradient(to bottom, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)`，`mix-blend-mode: overlay`。
  2. **颗粒噪点**：一次性用 canvas 生成 128×128 的灰度噪声 → `toDataURL` → 作为 `background-image` 平铺，`opacity: 0.06`，`mix-blend-mode: screen`；用 `animation` 每 ~120ms 轻微平移背景位置，制造"活"的抖动感（`will-change: background-position`，只改 transform-like 属性，几乎零成本）。
- 提供 `intensity?: "off" | "low" | "medium"` prop，默认 `low` 匹配参考图（几乎看不见但能感到不平）。

在 `src/routes/index.tsx` 里挂一次 `<GlitchGrainOverlay />`，通过现有的 `bgTheme`（`dark`/`light`）决定是否显示：
- `dark` 阶段 → overlay 可见（视频后黑幕、hands、正常黑底首屏）。
- `light` 阶段（预加载器白底、以及未来的浅色 section）→ overlay 淡出为 0。
- 用 CSS `transition: opacity 300ms` 避免切换硬边。

不改动：视频阶段自身的 shader glitch、hands 渲染逻辑、导航/HeroCopy/FinChatDock 结构。overlay 层 z-index 处在背景与 UI 之间（背景 0，overlay 1，hands/UI ≥ 2），不会遮盖交互。

## 涉及文件
- 新增 `src/components/GlitchGrainOverlay.tsx`
- 修改 `src/routes/index.tsx`：挂载 overlay 并绑定当前主题状态

## 验收
- 黑底区域能看到与参考图一致的轻微颗粒+扫描线，不影响文字/按钮清晰度。
- 白底（预加载）时 overlay 不可见。
- 无新增卡顿：只有一层静态背景 + 极慢的 background-position 动画。