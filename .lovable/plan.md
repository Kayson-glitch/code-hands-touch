# 第一屏 UI 参数 1:1 还原（不动动画/视频）

按 Figma 节点 `1412:20207`（1440 宽画板）还原第一屏的静态视觉参数：导航栏、Hero 文案区、底部输入条。不改动入场视频、UI 动画视频、滚动劫持、视差、呼吸等任何动效逻辑。

## 1. 导航栏（SiteNav）

- 高度 68px，内容容器固定宽 1200px 居中（当前是全宽 px-10）
- 底部为 2px 实线 `#137DFF`（当前是淡灰渐变细线）
- Logo 图 28×28，圆角全圆；品牌字 `Synergy.AI` Montserrat Medium 18px / 24px，色 `#0E0B22`
- 中部菜单：Montserrat Regular 14px / 22px，首字母大写样式；`Platform` 为 `#0E0B22`（当前态），其余 `Solution / Pricing / Company Hub` 为 `#7A7885`；每项内边距 16px，箭头图标 16×16
- 右侧：`Log in` 14px / 22px 色 `#0E0B22`，内边距 16px / 7px
- CTA `Book a Demo`：高 32、圆角 10、内边距 14×7、底色 `#0E0B22`、描边 `#0E0B22`、文字 Montserrat Medium 12px / 20px 白色
- 保留现有淡入与滚动毛玻璃行为，仅改尺寸与配色

## 2. Hero 文案区（HeroCopy）

- 容器宽 800px 居中，纵向 gap 40px，标题组内部 gap 10px
- 标题：Clash Display Medium 48px / 56px，capitalize
  - 第一行 `Support that drives revenue,` 色 `#C7C6CD`
  - 第二行 `powered by Synergy.AI.` 色 `#0E0B22`（**去掉彩虹渐变文字**）
- 副标题：Montserrat Regular 16px / 24px，色 `#0E0B22`，宽 380px 居中（当前是 `black/60`）
- Hero CTA `Book a Demo`：高 40、圆角 12、内边距 24×12、底色 `#0E0B22`、底部 1px `#137DFF`、文字 Montserrat Medium 16px / 24px 白色
  - **去掉**彩虹描边、彩虹流光背景与下方彩虹光晕（含对应 `rainbow-btn-flow` 使用）
  - 保留 hover 箭头微交互与整体淡入
- 垂直定位：Figma 中容器 top=188 / 画板对齐关系保持现有的 `useHeroLayout` 响应式方案，仅把桌面档位的字号/行高/副标题宽度/间距对齐上述数值

## 3. 底部输入条（FinChatDock 折叠态）

- 宽 400、高 48、圆角 666、白底、阴影 `0 12px 20px rgba(0,0,0,0.05)`
- 内边距：左 20、右 6、上下 6
- 占位文字 `What results can synergy drive?` Montserrat Regular 14px / 20px 色 `#A1A0A9`
- 右侧按钮 36×36 圆角 20，底色 `#C7C6CD`，内为 24×24 向上箭头（白色）
- 展开态、建议气泡、消息逻辑与动画不变

## 技术说明

- 涉及文件：`src/components/SiteNav.tsx`、`src/components/HeroCopy.tsx`、`src/components/FinChatDock.tsx`、`src/hooks/useHeroLayout.ts`（仅桌面档位数值）
- 新增语义色 token 到 `src/styles.css`：`--ink: #0E0B22`、`--ink-muted: #7A7885`、`--ink-faint: #A1A0A9`、`--ink-ghost: #C7C6CD`、`--hairline: #E1E0E4`、`--accent-blue: #137DFF`，组件里改用 token 而非硬编码色值
- 不改动：`HalftoneHandsFooter`、`IntroPreloader`、`IntroVideo`、滚动劫持与视差、`SloganSection`
- Figma 中的 `localhost:3845` 资源不引入项目，logo 继续用现有 `synergy-logo-v2` 资产
