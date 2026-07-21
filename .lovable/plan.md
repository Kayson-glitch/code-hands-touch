## 问题
开场首屏黑屏——`IntroVideo` 用 shader 采样 `VideoTexture`，但视频在 `loadedmetadata` 后立即被 pause，很多浏览器此时还没有解码任何一帧，`VideoTexture` 采样到全黑，shader 渲染出黑屏，直到用户滚动触发 `play()` 才出现画面。

## 修改（仅 `src/components/IntroVideo.tsx`）
1. **强制解码第一帧**：把当前 `video.play().then(pause)` 的一次性 hack 替换为更可靠的流程：
   - `loadedmetadata` 里除了写 `uVideoRes`，同时 `video.currentTime = 0`。
   - 新增 `loadeddata` / `seeked` 监听：在其中把 `videoTex.needsUpdate = true`，并在下一帧标记 `firstFrameReady = true`。
2. **兜底触发**：仍尝试一次 `video.play()` 然后立刻 `pause()`（异步），确保 Safari/Firefox 等把 decode pipeline 拉起来；失败时依赖 `currentTime=0` 的 seek 路径。
3. **避免"先渲染黑再出画面"的闪烁**：在 `firstFrameReady` 为 false 时，`renderer.setClearColor` 保持黑但**跳过 `renderer.render`**（或用一个纯黑 quad），一旦 ready 就正常渲染；实际画面首次出现的是第一帧而不是先黑一下。

其他所有行为（滚轮控制、平滑、burst、后续手部动画等）不变。

## 验证
- 刷新页面，首屏立即出现视频第一帧（手臂静止画面），无明显黑屏空档。
- 滚动、跟手、burst 与手部动画流程与现在一致。
