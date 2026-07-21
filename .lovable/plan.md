## 目标
让开屏视频的滚轮控制更丝滑：消除高频滚轮事件导致的抖动/跳帧，让进度在停止滚动后仍以自然的缓动继续，同时把视频 currentTime 的更新变得平滑。

## 现状问题（`src/components/IntroVideo.tsx`）
1. `onWheel` 直接把 `deltaY` 累加到 `progress`，滚轮的原始 delta 本身就是离散、跳变的（尤其鼠标滚轮 vs 触控板差异极大），画面会一顿一顿。
2. `video.currentTime` 每帧硬设，浏览器 seek 有开销，容易卡帧。
3. 没有惯性/回弹，停止滚动瞬间进度也瞬间停止，缺乏丝滑感。
4. 触控板和鼠标滚轮 delta 数量级不同，未做归一化。

## 方案
仅修改 `src/components/IntroVideo.tsx`，不动其他文件。

1. 引入 `targetProgress` 与 `progress` 双值：
   - `onWheel` 只累加到 `targetProgress`（带 clamp）。
   - 每帧用指数平滑 `progress += (target - progress) * k`，`k` 按帧时长归一（约 12–15/秒），得到丝滑跟随 + 停止后的短暂惯性延续。
2. 滚轮 delta 归一化：
   - 依据 `e.deltaMode`（PIXEL/LINE/PAGE）换算成像素。
   - 对单次极大 delta 做上限裁剪（避免鼠标滚轮巨跳）。
   - 略微提高 `PIXELS_FOR_FULL_PROGRESS`（如 2600 → 3200）以配合平滑后手感。
3. 视频 seek 平滑：
   - 只在 `videoProgress` 变化超过阈值（如 > 1 帧 ≈ 0.033s）时才写 `currentTime`。
   - 用 `requestVideoFrameCallback`（可用时）或保持当前 RAF，但把阈值放宽，避免频繁 seek 抖动。
4. 保留现有 burst/进度回调行为不变，`onProgress` 依旧输出平滑后的 `progress`。

## 验收
- 快速/慢速滚动、触控板双指滑动均无明显卡顿。
- 停止滚动后进度会顺滑收敛到目标值，不会硬停。
- 到达 1 时依旧正确 `fire()` 触发下一阶段。
- 不影响手部动画、hover、点击等其他效果。
