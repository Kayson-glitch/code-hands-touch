## 导航栏改造为胶囊悬浮样式

参考图效果：整个导航是一颗居中悬浮的圆角胶囊，深色半透明玻璃背景 + 细边描边；Logo/菜单/Login/Signup 都收纳在同一颗胶囊里，Signup 是白底黑字实心按钮，Login 是描边幽灵按钮。

### 视觉规则
- 胶囊居中悬浮，距顶部 20px，左右自适应内边距，`rounded-full`。
- 深色背景下：胶囊 `bg-black/55` + `backdrop-blur-xl` + `border-white/12`；Login 描边 `border-white/25`；Signup `bg-white text-black`。
- 浅色背景下（视频阶段）反相：胶囊 `bg-white/70` + `border-black/10`；Login 描边 `border-black/20`；Signup `bg-black text-white`。
- 文字/按钮尺寸完全保持现状：菜单 14px/22、CTA 高 32px、Logo 高 28px。仅容器形态改变。

### 结构改动（仅 `src/components/SiteNav.tsx`）
- 外层保留 `fixed inset-x-0 top-0`，改为 `flex justify-center`，去掉原来的整行 `justify-between`。
- 内层新增胶囊 `<div>`：`flex items-center gap-8 rounded-full border px-4 py-2`，包住 Logo、居中菜单、Login、Signup。
- Login 从纯文字按钮改为描边胶囊按钮（`rounded-full border px-4 h-8`），保持字号不变。
- 主题切换逻辑复用现有 `theme` state，只把 class 映射换成胶囊配色。

### 不动的部分
- 显隐时序（`app-nav-visibility` / `app-bg-change`）、logo 资源、Chevron、字号、按钮高度、Book a Demo 交互全部保持。
- 不改其他组件。
