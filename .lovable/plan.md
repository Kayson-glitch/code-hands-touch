## Goal

在第一屏（fixed hero）背景层加入 React Bits Pro 的 **Squircle Shift** 形态动画，作为背景装饰，位于黑色底 + 扫描线之上、ASCII 手 / 文案之下，先看效果再微调。

## 前置条件（需要你确认）

React Bits Pro 组件是私有 registry，`npx shadcn add` 必须带上 `REACTBITS_LICENSE_KEY` 才能拉取。请确认一件事：

- 是否已经有 `REACTBITS_LICENSE_KEY`（Pro license key）？
  - **有** → 我用 `add_secret` 把它保存为构建期可用的密钥，然后继续下面步骤。
  - **没有** → 需要你先去 pro.reactbits.dev 拿到 key 再继续，否则安装会 401。

## 实施步骤（拿到 key 之后）

1. **配置 registry**：在 `components.json` 的 `registries` 中加入 `@reactbits-starter`，指向 Pro registry URL，带上 `Authorization: Bearer ${REACTBITS_LICENSE_KEY}` header（按官方 installation 文档格式）。
2. **安装组件**：运行 `npx shadcn@latest add @reactbits-starter/squircle-shift-tw`，把组件文件写入 `src/components/ui/`（或 registry 指定路径）。
3. **接入第一屏背景**：在 `src/routes/index.tsx` 的 fixed hero 容器里，`AsciiHandsFooter` **之前**（更低层级）插入一个 wrapper：
   - `position: absolute; inset: 0; pointer-events: none; z-index: 3`（介于扫描线 z=2 与手 / 文案之间；如实际层级不合适再调）。
   - 内部渲染 `<SquircleShift />`，尺寸铺满，颜色使用现有紫色主题（`#C5A9FF` 或半透明白）以避免和手部冲突。
4. **仅作用于第一屏**：wrapper 放在 fixed hero 容器内即可，跟随 parallax，不会渗透到第二屏 / 对话框 / 导航栏。
5. **不改动**：`SloganSection`、`FinChatDock`、`SiteNav`、`IntroVideo` 扫描线层、按钮 / 标题动画等一律不动。

## 验证

- 首屏加载完成后可见 squircle 形态动画作为背景装饰。
- 开场视频、扩散阶段、第二屏、导航栏、按钮 hover、底部对话框均无变化。
- 手部点击 / hover、按钮点击、导航点击不被拦截（`pointer-events: none`）。

## 需要你回复

1. 是否有 `REACTBITS_LICENSE_KEY`？
2. 颜色偏好：延续现有紫色 `#C5A9FF`，还是想换一种（白色半透明 / 彩色）？
