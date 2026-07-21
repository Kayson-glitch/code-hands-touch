## 问题诊断

当前 `src/components/IntroVideo.tsx` 里滚动"卡"的主因不是平滑算法，而是**每帧都在 `video.currentTime = target` 上做 seek**：

- `SEEK_EPSILON = 0.04` 秒（≈1 帧）→ 只要平滑值持续追赶目标，几乎每个 rAF 都会触发一次 seek。
- 浏览器解码非关键帧的 seek 成本很高，MP4 的 GOP 大时会出现明显掉帧/闪烁，表现就是"卡顿"。
- 同时 `onProgress` 回调每帧都触发一次 React 状态更新（父组件 `AsciiHandsFooter` 里），也会叠加主线程压力。

## 优化方案

改动只限于 `src/components/IntroVideo.tsx`，视觉/交互不变，只让手感更顺：

1. **Seek 节流** — 把视频 seek 从"每帧 diff > 1 帧就 seek"改成：
   - 时间节流：最多每 ~66ms（≈15fps）seek 一次；
   - 距离阈值放宽到 ~0.08s；
   - 优先使用 `video.fastSeek?.(target)`，失败回退 `currentTime`。
   这样解码压力大幅下降，画面追赶滚轮的视觉流畅度反而提升。

2. **平滑参数微调** — `SMOOTH_RATE` 从 12 提到 ~16，让指针跟随更贴合滚轮；单 tick 上限 `MAX_PIXELS_PER_TICK` 从 180 降到 140，避免鼠标滚轮一格造成"跳跃 + 长追赶"的拖影感。

3. **`onProgress` 节流** — 仅当 `progress` 相对上次通知变化 > 0.003 时才调用，减少父组件重渲染频次；关键状态（fire / burst 起止）仍即时触发。

4. **wheel 监听优化** — 保持 `passive: false`（需要 `preventDefault`），但把累加逻辑改成只写 `targetProgress`（当前已经是这样），确认没有在 wheel 回调里做 DOM 读写。

5. **可选**：滚动时若目标 > 当前较多（快速滚动），临时提高 `alpha` 上限，让快速滚动时视频跟得更紧、慢速滚动时保持柔和。

## 不改的内容

- 布局、UI、shader、burst 效果、`VIDEO_FRACTION`、总滚动像素 `PIXELS_FOR_FULL_PROGRESS` 全部保持不变。
- 手部/标题/导航等其他组件不动。

## 技术备注

Seek 节流的核心代码大致如下（示意）：

```text
if (now - lastSeekAt > 66 && |target - lastSeekTime| > 0.08) {
  (video.fastSeek ?? assignCurrentTime)(target);
  lastSeekAt = now; lastSeekTime = target;
}
```

完成后我会在预览里滚一次，确认无掉帧再交付。
