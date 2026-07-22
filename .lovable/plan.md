## 问题
预览环境是生产构建，`import.meta.env.DEV=false`，导致：
- `BurnDebugPanel` 没渲染（你也没看到面板）
- `debugRef.current=false`，`onWheel` 在 `burnActive` 后 `preventDefault` 并直接 return，`uBurn` 由 `performance.now()` 时间线自动跑
- 结果：滚到视频末尾后光圈自动扩散，滚轮完全失效

上一次改动加了 debug 分支，但没有任何入口在预览环境把 debug 打开。

## 方案（只改 2 个文件）

### 1. `src/routes/index.tsx`
读取 URL 查询参数 `?debug=1`（或 `?burn=1`），存到 state，透传给 `AsciiHandsFooter`（现有 `debug` prop 走通到 `IntroVideo`）。SSR 期间读不到 window，用 `useEffect` 客户端再打开，避免 hydration 报错。

### 2. `src/components/IntroVideo.tsx`
- `debug` prop 现在是必传/明确布尔，不再回退到 `import.meta.env.DEV`（去掉 `debug ?? import.meta.env.DEV`），改为 `const debugEnabled = !!debug`。这样只要 URL 带 `?debug=1`，任何环境（生产 / 预览 / dev）都进入 debug 分支：
  - 面板出现
  - 滚轮双向驱动 `uBurn`
  - `Finish →` 才 `fire()`
- 不改 shader、平滑、seek 逻辑、时间常数。

### 3.（如果 `AsciiHandsFooter` 里没往下传 debug）
在 `<IntroVideo ... />` 那一行补 `debug={debug}`，并在组件 props 里加 `debug?: boolean`。上面 `rg` 已经确认目前调用点是 `<IntroVideo onEnded={...} onProgress={...} src={videoSrc} />`，没有 debug prop，需要补。

## 使用方式
- 调参：打开 `/?debug=1` → 视频段正常滚 → 到末帧继续向下滚，光圈随滚轮扩张 / 向上滚缩回 → 面板改参数实时预览 → 点 `Finish →` 进入 hands。
- 正式访问 `/` 不受影响，仍是"滚到末帧自动扩散"的生产行为。

## 不改动
- Shader / 光圈层次 / 颜色 / 时长
- 视频段滚动与 seek 策略
- Preloader / Nav / Hero / ChatDock
- 生产环境的不可逆行为