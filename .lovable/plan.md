## 目标
彻底消除追赶感与漂移。视频始终 `paused`，每个 rAF 直接把 `currentTime` 设置为当前滚动进度对应的时间。all-intra 后 seek ≈ 1 帧成本，正反完全对称，滚动停即定格。

## 改动范围
只改 `src/components/IntroVideo.tsx`，视频文件不动。

### 1. 删除追帧逻辑
移除 / 简化：
- `pauseVideo` / `setChasePlayback` / `wantsForwardPlayback` / `playPending`
- `MIN_CHASE_RATE` / `MAX_CHASE_RATE` / `GAP_HARD_SEEK` / `GAP_BACKWARD_SEEK` / `GAP_DEAD_ZONE` / `BACKWARD_SEEK_MIN_INTERVAL_MS` / `lastBackwardSeekTs`
- 循环里 778–812 那段五分支 gap 判断
- `video.play()` 的启动路径（仅保留一次静默 play→pause 用来触发首帧解码，之后永不再 play）

### 2. 每帧直接 seek
在循环里替换成：
```ts
if (!burstEngaged && video.duration && firstFrameReady) {
  const targetTime = clamp01(progress / VIDEO_FRACTION) * video.duration;
  // 只在跨越 ≥ 半帧时才写入，避免同帧内重复 seek
  if (Math.abs(targetTime - mediaTime) > 1 / video.duration / 48) {
    const fs = (video as any).fastSeek;
    if (typeof fs === "function") fs.call(video, targetTime);
    else video.currentTime = targetTime;
    mediaTime = targetTime;
    mediaFrameDirty = true;
  }
}
```
（阈值取 ~half-frame，24fps 视频 ≈ 21ms；防止一帧内多次赋值）

### 3. 收缩平滑
`PROGRESS_SMOOTH_TIME` 从 0.035 降到 **0.018**（几乎直连滚轮，只吸收 wheel 事件本身的抖动）。删除 `GAP_DEAD_ZONE` / `GAP_BACKWARD_SEEK` / `BACKWARD_SEEK_MIN_INTERVAL_MS` 常量。

### 4. 保留
- 首帧解码 warmup（play→pause once）
- rVFC 回调只用于 `mediaFrameDirty` 触发重绘，不再作为时间源
- burst 阶段完全不变（burst 只依赖 `burnClock`，本来就不 seek）

## 验证
1. Playwright 打开首屏：慢速滚动 5px → 视频 `currentTime` 应立即变化；停止滚动 → 视频立刻定格无漂移；反向滚动 → currentTime 立即减小
2. 手感对比：正反手感一致、无追赶、无回弹惯性
3. 若个别设备（Safari 老版）连续 seek 掉帧，回退方案：把 seek 阈值放宽到 1 整帧 (~42ms)

## 不改动
- 视频 asset（保持 all-intra 6MB）
- burn 转场、shader、preloader、滚动映射比例（2200px / VIDEO_FRACTION 0.6）
