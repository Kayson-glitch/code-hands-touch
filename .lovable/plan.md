## 修复内容

修复 `IntroPreloader.tsx` 中 `0%` 直接跳到开场的问题（视频已被缓存时 `fetch` 瞬间完成，用户来不及看到百分比）。实现真实字节进度作为上限，但显示层强制满足：
- 最小爬升时长 900ms：显示数字不会瞬跳，而是每帧以不超过 `100 / 0.9 ≈ 111.1%/s` 的速率向真实进度追赶；网速慢时则跟随真实进度，不虚报。
- 最小停留 250ms：真实下载完成且显示到达 100% 后，再等待 250ms 才触发 `onReady` 进入下一步，避免 `100%` 一闪而过。

## 具体实现

仅修改 `src/components/IntroPreloader.tsx`：

1. 新增内部状态：
   - `displayPct`：用于渲染的平滑显示百分比。
   - `realPctRef`：实时字节进度（0-100）。
   - 记录 `downloadDoneAt`（字节下载完成时间）和 `holdDoneAt`（最小停留结束时间）。

2. 用 `requestAnimationFrame` 循环驱动 `displayPct`：
   - 每帧 `displayPct = min(realPct, displayPct + (100 / 0.9) * dt)`。
   - 当 `realPct >= 100` 且 `displayPct >= 100` 时启动 250ms 停留计时；停留结束后调用 `finish()`。

3. 保持现有行为不变：
   - 没有 `Content-Length` 时仍然隐藏百分比（fallback 进入）。
   - `fetch` 失败或 abort 时仍然调用 `onFail()`。
   - 视频首帧预热逻辑（隐藏 `<video>` + `loadeddata` + 1.5s 安全超时）保持不变。
   - 样式（黑底、居中、48px Montserrat 500）保持不变。

## 验收标准

- 缓存命中时能看到 `0% → 1% → ... → 100%` 约 900ms 的爬升，然后停留 250ms 才进入开场。
- 网络较慢时数字跟随真实字节进度，不会卡住等待。
- 失败场景仍回退到原有流程，不阻塞。
- 其他文件零改动。