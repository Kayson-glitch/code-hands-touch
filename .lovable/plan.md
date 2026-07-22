## 问题定位

`IntroVideo.tsx` 中 `VIDEO_FRACTION = 0.6` 把总滚动预算切成两段：
- `0 → 0.6`：驱动视频从第一帧到最后一帧
- `0.6 → 1.0`：**空滚动区**，视频已停在最后一帧，但没有任何视觉反馈
- `progress >= 1` 才触发 burn

所以视频看似播完后，用户还需继续滚 40% 预算（约 1280px 滚轮距离）才能看到扩张动画 —— 这就是"手指不动了还要滚很久"的原因。

## 修复方案

让扩张动画在视频到达最后一帧的瞬间无缝接上，不再需要额外滚动：

1. 把 burn 触发条件从 `progress >= 1` 改为 `videoProgress >= 1`（即 `progress >= VIDEO_FRACTION`）。
2. 触发时把 `targetProgress` 和 `progress` 直接锁到 `1`，让后续 wheel 事件即使有惯性也不会再对齐到 `0.6` 附近，`burnActive` 已经会 `preventDefault` 忽略新的 wheel。
3. `burstProgress` 通知给父级的映射保持不变（仍由 `burnActive` 后的 `uBurn` 时间线驱动，父级用它做 UI 淡入即可）；为一致性，触发瞬间把 `burstProgress` 通知为 `>0`，让外部状态机进入 burst 阶段。

不改动：
- burn 的时长（3.6s）、缓动曲线、亮环样式
- 视频播放 / seek 策略
- 预加载器、SiteNav、Hero 等其它组件

## 技术细节

在 `loop()` 中：
```
- if (!burnActive && progress >= 1) {
+ if (!burnActive && videoProgress >= 1) {
    burnActive = true;
    burnStartedAt = now;
+   progress = 1;
+   targetProgress = 1;
    pauseVideo();
  }
```

可选微调：把 `VIDEO_FRACTION` 直接设为 `1.0`，让整段滚动预算都用于视频（避免用户在视频阶段感觉滚得太快）。上面的补丁已经能解决卡顿感，是否同时调 fraction 由你决定 —— 见下方问题。

验证：修改后用 Playwright 模拟连续滚轮，观察 `videoProgress` 到 1 的瞬间 `uBurn` 是否立刻开始递增、canvas 上是否直接出现扩张亮环。