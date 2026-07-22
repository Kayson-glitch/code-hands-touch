## 目标
1. 缩短「扩散动画结束 → UI 出现」之间的纯黑屏停留。
2. 该黑屏阶段内不能出现导航栏（当前实现里 nav 在扩散完成瞬间就会短暂显示，然后被 hide 再 show，观感上仍能看到）。

## 现状
- `IntroVideo` 扩散完成 → `AsciiHandsFooter.handleIntroEnded` 触发：
  - `setBgDark(true)` → `HeroCopy` 收到 `app-bg-change=dark`，**再等 700ms** 才 fade in（`src/components/HeroCopy.tsx:13`）。
  - 同时 dispatch `app-nav-visibility=hidden`，**850ms 后**再 `visible`（`src/components/AsciiHandsFooter.tsx:1321-1325`）。
- `SiteNav` 默认状态是 `hidden=false`（可见），在整个视频/扩散阶段其实一直挂着。扩散过程中背景变黑时，nav 会在黑屏上短暂出现，直到 `handleIntroEnded` 才被隐藏。

## 修改

### `src/components/AsciiHandsFooter.tsx`
- 在**扩散开始时**（`handleIntroProgress` 首次收到 `progress > 0` 或 burst 起点）就 dispatch `app-nav-visibility=hidden`，保证整个黑屏过渡期间 nav 都是隐藏的。
- 把 `handleIntroEnded` 里重新显示 nav 的延时从 `850ms` 缩短到 `320ms`，与新的 hero fade-in 时机对齐。
- `handoffBlack` 覆盖层的 `setTimeout(..., 300)` 缩短到 `160ms`，减少纯黑帧数量。

### `src/components/HeroCopy.tsx`
- 将 `app-bg-change=dark` 后的 fade-in 延时从 `700ms` 降到 `280ms`，让 UI 更快浮出。

### `src/components/SiteNav.tsx`
- 初始 `hidden` 默认值改为 `true`，只有收到 `visible` 事件才显示，避免视频阶段外露及扩散黑屏瞬间闪现。

## 不改动
- 扩散动画本身的时长、形状、shader 逻辑。
- 视频滚动、preloader、ASCII 手部动画逻辑。

## 验证
预览刷新，滚动播放至视频结束 → 扩散 1.8s 匀速完成 → 观察：
- 扩散过程中及结束后的黑屏期间导航栏不可见；
- 黑屏时长明显缩短（≈150–300ms 内 hero 文案/按钮开始淡入，nav 同步出现）。
