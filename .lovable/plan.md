## 目标
优化 `src/components/IntroVideo.tsx` 的滚轮驱动播放，让正向/反向滚动都丝滑，消除回滚时的顿挫。

## 现状诊断
- 滚轮 → `targetProgress`，缓动到 `progress`；但 `SMOOTH_RATE=10` + `SMOOTH_RATE_FAST=14` 且随 gap 放大，正向大 gap 时会突然加速追上，反向同样，形成"卡顿感"。
- 反向滚动主要靠 `commitSeek`（`VIDEO_BACKWARD_SEEK_EPSILON=0.12`、`SEEK_MIN_INTERVAL_MS=80`）：只有 gap > 0.12s 且距离上次 seek > 80ms 才 seek，其间画面完全静止 → 回滚时出现"停一下再跳一段"的阶梯感。
- 单帧 `MAX_PIXELS_PER_TICK=140` 上限太低，触控板/高分鼠标一次滚动被截断，节奏被打断。
- `playbackRate` 上限 2.35，快速正向滚动时视频追不上目标，也会产生迟滞。

## 优化方案（仅改 `IntroVideo.tsx`，不动 UI/视觉）

1. **统一、对称的缓动**
   - 移除 gap 自适应双速率，改成单一 `SMOOTH_RATE ≈ 12` 的 frame-rate independent exponential smoothing，正反方向一致。
   - 提高每帧最大追赶速度上限（例如 `alpha` 上限 0.35），配合更小的 snap 阈值 (`0.0002`) 消除末端抖动。

2. **放宽单次滚轮上限**
   - `MAX_PIXELS_PER_TICK` 从 140 提到 260；`PIXELS_FOR_FULL_PROGRESS` 从 3200 微调到 2600，让快速滚动响应更跟手，同时缓动仍能抹平突变。

3. **反向滚动改为"连续追帧"**
   - 反向时不再等待 seek 阈值 + 冷却：只要 `gap < -0.02` 且距上次 seek > `24ms`（约一帧），就用 `fastSeek(target)` 追帧；`video` 保持 pause，靠 seek 逐帧回退。
   - 保留 `commitSeek` 大跳判断（`|gap| > 0.48`）作为兜底。
   - 将 `VIDEO_BACKWARD_SEEK_EPSILON` 降到 `0.02`、`SEEK_MIN_INTERVAL_MS` 降到 `24`。

4. **正向追赶更宽松**
   - `MAX_CHASE_PLAYBACK_RATE` 提到 `3.2`；`playVideoTowardTarget` 的速率公式改为 `1 + gap * 6`，避免快速滚动时视频落后于 shader 进度。

5. **消除 burst 阶段的反向卡顿**
   - `burstProgress > 0` 时，无论正反都直接锁定视频最后一帧（不再触发反向 seek），因为 burn 完全由 shader 的 `uBurn` 驱动，视频不需要回退，避免最后阶段来回 seek 产生闪动。

6. **保护措施**
   - 保留 `firstFrameReady` 门控与 `needsUpdate` 刷新。
   - `dt` clamp 保持 0.05s，避免切页回来跳变。

## 技术细节
```text
onWheel      →  targetProgress (0..1)  [pixel-based, 更宽 tick 上限]
每帧 loop:
  progress ← exp-smooth(target, rate=12)   // 正反对称
  videoProgress = progress / 0.6
  if burstProgress > 0:     pause + 锁末帧
  elif gap > +ε:            playForward(rate=1+gap*6, 上限 3.2)
  elif gap < -ε(0.02):      每 ~24ms fastSeek(target)   // 平滑回退
  else:                     pause
  uBurn = burstProgress                      // 完全跟随滚轮
```

## 验收
- 慢速反向滚动：画面连续回退，无"停顿→跳跃"。
- 快速正/反向滚动：无爆点、无回弹；停止即停止。
- burn 阶段来回滚动：光圈平滑收放，视频不闪。
- 构建通过，无 TS 报错。