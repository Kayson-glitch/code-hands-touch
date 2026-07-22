## 目标
IntroVideo 首次进入播放与从预加载切换阶段时仍偶有卡顿。原因：预加载虽下载了字节并触发了 `loadeddata`，但真正的解码上下文（`HAVE_ENOUGH_DATA=4`、首帧解码、`play()` warm-up、纹理首次上传到 GPU）都发生在 IntroVideo 挂载后。我们要做的是把这些阶段前置并串起来，使得进入 IntroVideo 时首帧、seek、shader 采样都已"热"过。

## 分阶段预加载 / 解码准备策略

### Stage A — 字节预下载（IntroPreloader 现有行为，保留）
- `fetch` 流式读取 + Content-Length 驱动百分比。
- 完成后生成 `blob:` URL。

### Stage B — 解码握手（升级 IntroPreloader 的 prewarm）
把现在的"隐藏 video + loadeddata"升级为完整的解码握手，然后把握手好的 video 元素通过 `onReady` 交给下一阶段：

1. 创建隐藏 `<video muted playsInline preload="auto">`，挂到 body（`position: fixed; opacity: 0; width:1; height:1; pointer-events:none`），保证浏览器真的分配解码器。
2. 等待信号（按优先级 race，任一命中即算成功，均设 1500ms 兜底）：
   - `loadedmetadata`（拿到时长和分辨率）
   - `loadeddata`（首帧解码完成）
   - `canplay` / `canplaythrough`（`readyState ≥ 3/4`）
3. `video.currentTime = 0`，等 `seeked`，确保 seek 通道也已预热。
4. 调用 `video.play()` 一次触发解码器 warm-up，随后 `pause()`，将 `currentTime` 归零。
5. 若浏览器支持 `HTMLVideoElement.requestVideoFrameCallback`，等一次回调，确认帧真的可被合成。

### Stage C — 交接（handoff 到 IntroVideo）
`IntroPreloader` 现在只传 objectUrl。改成传一个 handshake 对象 `{ url, videoEl, videoW, videoH, duration }`，其中 `videoEl` 就是 Stage B 里预热过的 DOM video：

- `IntroVideo` 不再自己 `new video`，而是把这个已就绪的 `<video>` 直接 `appendChild` 到自己的容器（或 detach 再 attach），沿用同一个解码器实例。
- 因为同一个元素已经是 `HAVE_ENOUGH_DATA`，首个 `THREE.VideoTexture` 上传立即拿到有效帧，`markFirstFrame`/`firstFrameReady` 在挂载那一帧就为 true，不再需要 `play().then(pause)` 的兜底。
- 首次 `seek(0)` 已在 Stage B 做过，后续 seek 的冷启动开销消失。

### Stage D — GPU 纹理预热
IntroVideo 挂载时（在 fire 事件与 wheel 监听之前）：
1. 建 `VideoTexture` 后立刻调用一次 `renderer.render(scene, camera)`，把纹理上传到 GPU。这一帧用 `uProgress=0, uBurn=0` 保证视觉是视频第一帧。
2. 只有渲染成功后才把 canvas 从 `opacity: 0` 提到 `1`（新增一个 `ready` 状态），避免"黑一帧再显示"。

### 兼容与回退
- Stage B 的任何 handshake 步骤失败 → 走原路径（IntroVideo 自己 load），只损失一次预热，不影响功能。
- `requestVideoFrameCallback` 不存在时跳过该步。
- Safari 对 blob src 的 `play()` 有时被拒（NotAllowedError），静默捕获，不影响后续。

## 涉及文件
- `src/components/IntroPreloader.tsx`：把 `finish(url)` 换成 Stage B 的完整握手序列；`onReady` 签名扩展。
- `src/components/IntroVideo.tsx`：新增 `handoffVideo?: HTMLVideoElement` prop；如提供则复用元素、跳过内部 `play()/pause()` warm-up；挂载后先执行一次 GPU 预热渲染，再切 canvas 可见。
- `src/routes/index.tsx`（或持有 preloader→introvideo 的父组件）：把新握手对象透传下去。

## 验收
- 从 preloader 100% → IntroVideo 首帧无黑闪。
- 首次向下滚动第一次 seek 无停顿。
- 到达 `videoProgress=1` 触发 burn 阶段时，shader 首帧不再出现空纹理。
