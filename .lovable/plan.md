## 目标
Hero 区域的标题（含渐变的 "Synergy.AI." 部分）以 React Bits `BlurText` 的模糊+位移入场动画整体呈现；副标题与按钮保持现有行为不变。

## 修改

### 1. 新增 `src/components/BlurText.tsx`
按提供的源码原样落地组件（TS 化后：为 props 补上类型），使用 `motion/react`。

### 2. 安装依赖
`bun add motion`

### 3. `src/components/HeroCopy.tsx`
- 引入 `BlurText`。
- 保留现有 `visible` 触发机制（等 `app-bg-change=dark` 后 280ms），把标题从 `<h1>` 静态 JSX 换成 `BlurText`，仍然通过外层容器的 `opacity/transform` 控制整体登场时机（副标题+按钮的淡入不变）。
- 因为标题带渐变色的 "Synergy.AI." 是 span，`BlurText` 只接收纯字符串，会破坏渐变。做法：
  - 用两个 `BlurText` 拼一行：
    1. `BlurText text="Support that drives revenue, powered by"` 白色。
    2. `BlurText text="Synergy.AI."` 通过 `className` 应用渐变文字样式（`bg-clip-text text-transparent` + 内联 `background-image` 渐变），保证每个 word span 都继承渐变。
  - 两段 flex-wrap 排在一行，视觉上等价原两行标题（原本就是 `<br />` 手动换行，这里改为让 flex 自然换行；容器居中、`max-width: 900px` 保留）。
- `animateBy="words"`，`direction="top"`，`delay=120`，`stepDuration=0.5`，仅在 `visible=true` 时挂载 `BlurText`（key 触发一次），避免页面初始就播完。

### 4. 不改动
- `SiteNav`、`FinChatDock`、扩散动画、视频、导航栏可见性逻辑。
- 副标题 `<p>` 与 "Book a Demo" 按钮保持现在的容器级淡入。

## 验证
预览刷新 → 视频扩散结束 → hero 出现时，标题按单词依次从上方模糊淡入落位，"Synergy.AI." 渐变颜色正确、副标题与按钮同步淡入。
