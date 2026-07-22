## 目标
Hero 的标题、副标题、按钮作为**一个整体**做模糊入场动画（blur+位移+淡入），不再按词/字符分段。

## 修改 `src/components/HeroCopy.tsx`
- 移除 `BlurText`，恢复原 `<h1>`（含 "Synergy.AI." 渐变 span）、`<p>` 副标题、`<button>` 三个静态元素。
- 保留 `visible` 触发时机（`app-bg-change=dark` 后 280ms）。
- 在外层容器上应用整体动画：
  - `initial`: `opacity: 0`, `filter: blur(12px)`, `transform: translateY(24px)`
  - `visible`: `opacity: 1`, `filter: blur(0)`, `transform: translateY(0)`
  - `transition`: `opacity 900ms ease-out, filter 900ms ease-out, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)`
- 加 `willChange: "opacity, filter, transform"`。
- 不使用 motion 库（纯 CSS transition 就够；BlurText 组件保留在文件里但不再引用，或后续清理）。

## 不改动
- 导航、扩散动画、视频、字体、颜色、布局位置。

## 验证
预览刷新 → 扩散完成 → hero 三行（标题+副标题+按钮）作为整体从模糊到清晰同时淡入落位。
