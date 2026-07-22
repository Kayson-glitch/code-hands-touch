## 根因

`<body>` 的主题背景色是白色（`--background: oklch(1 0 0)`）。目前只有 `<section>`（AsciiHandsFooter）在 burn 完成瞬间被切成 `#0a0a0a`。当 `IntroVideo` 500ms 后卸载时，其全屏黑色 `<div>` 从 DOM 移除，浏览器在这一帧合成期间可能短暂露出 body 的白色底色，造成"扩散完成 → 白闪一下 → ASCII 手出现"的效果。

我 40ms 密集截图没有捕获到这一帧，说明它是浏览器合成层面的单帧闪烁，只有在真机上偶发可见——这正符合用户描述。

## 修复

改动只在两个地方，其他行为完全不变。

**1. `src/components/AsciiHandsFooter.tsx`**
- 在 `handleIntroEnded` 里，除了 `setBgDark(true)` 之外，同步给 `document.documentElement.style.backgroundColor` 和 `document.body.style.backgroundColor` 赋 `#0a0a0a`。
- 这样即使 IntroVideo 卸载一帧内 section 未及时合成，露出的也是黑色 html/body 而非白色。
- 组件卸载时不需要还原（首屏只走一次，且后续 UI 全部是深色主题）。

**2. `src/components/AsciiHandsFooter.tsx`（保险层，兜底）**
- 在 `<section>` 里额外挂一个 `position: fixed; inset: 0; background: #000; zIndex: -1` 的持久黑幕，`stage === "hands"` 时启用。这样即便未来 DOM 结构变化，也不会再出现 body 白色泄漏。

（不需要修改 shader、不需要改 burn 时序、不需要动 `IntroVideo`。）

## 验证

修改后不容易在自动截图里稳定复现（因为原本也需要极窄的合成时机），但可以做静态验证：
- 在浏览器里手动把 IntroVideo 层临时删除，确认露出的是黑色而不是白色。
- 用 `document.body` 的 computed `background-color` 在 stage=hands 时应为 `rgb(10, 10, 10)`。