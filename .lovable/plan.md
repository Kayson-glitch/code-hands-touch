## 目标
用鼠标滚轮控制视频播放进度，取代自动播放。滚到视频末尾时触发 `onEnded` 进入手部动画。

## 改动 `src/components/IntroVideo.tsx`

1. 视频不再 autoplay：主视频与背景视频挂载后立即 `pause()`，并等 `loadedmetadata` 拿到 duration。
2. 页面级 `wheel` 监听（`passive: false`，`preventDefault` 阻止页面滚动）：
   - 累加 `deltaY`，按灵敏度换算为秒数：`SECONDS_PER_PIXEL = 0.004`（可微调）。
   - `currentTime = clamp(current + delta, 0, duration)`；每帧用 `requestAnimationFrame` 合并写入，避免频繁 seek 卡顿。
   - 主视频与背景视频 `currentTime` 保持同步。
3. 到达 `duration - 0.05` 时调用 `fire()`（现有逻辑），并移除 wheel 监听。
4. 移除 4300ms fallback（滚轮驱动下不需要）；保留 `error` 时的 fallback 以防视频加载失败。
5. 只支持向前推进（可选）：默认允许双向滚动（前进/回退），停留在 plan 中确认为双向。

## 保留不变
- 模糊背景 + contain 前景布局。
- `onEnded` 回调签名。
- 手部动画阶段的全部逻辑。
