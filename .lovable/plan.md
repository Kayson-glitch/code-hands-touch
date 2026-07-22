## 诊断
反向滚动"回弹"感来自两处：

1. **两级级联缓动的尾部拖尾**：`rawTarget → smoothTarget → progress` 是两个串联的一阶低通滤波器，反向滚动后 stop 时，`progress` 仍有 ~150–200ms 的追尾。虽然数学上是单调下降，视觉上因为叠加了视频 `fastSeek` 的帧跳跃，被感知为"往回弹一下"。
2. **`fastSeek` 反向抖动**：反向 scrub 时 `fastSeek` 会吸附到最近关键帧，`video.currentTime` 前后跳变；下一帧计算 `gap` 又基于跳后的值，导致相邻帧渲染的帧号先退后进，形成明显回弹。
3. **`wheelVelocity` 惯性延迟**：`fastRate` 随速度自适应，反向刚停时速度仍高，`smoothTarget` 追得快；1–2 帧后速度衰减，smoothing 突然变慢，节奏断层被眼睛捕捉为弹跳。

## 方案（仅改 `src/components/IntroVideo.tsx`）

1. **回到单级对称平滑**
   - 删除 `smoothTarget` 中间层与速度自适应 (`RAW_SMOOTH_RATE_*` / `WHEEL_VELOCITY_FAST`)。
   - 保留 RAF 累积 (`pendingWheelPx`)，一次性写入 `targetProgress`。
   - `progress += (targetProgress - progress) * (1 - exp(-16 * dt))`，正反完全对称，无自适应，无二级追尾。
   - `alpha` 上限 0.45，snap 阈值 0.0002。

2. **反向 seek 直接跟随 `targetProgress`（消除双滞后）**
   - 反向时，视频 seek 的目标改用 `targetProgress`（用户最新意图）而非 `progress`，让视频立刻回退到位；shader 上的 `uProgress` 仍用平滑后的 `progress`，只有视觉滤镜是柔性的，视频帧本身不再拖泥带水。
   - 正向仍用 `progress` 触发 `playVideoTowardTarget`（避免视频跑得比 shader 快）。

3. **反向永远用精确 seek**
   - `commitSeek` 反向分支强制 `exact=true`（`video.currentTime = target`），彻底禁用 `fastSeek` 的关键帧吸附。
   - 反向 `seekCooldownLeft` 降到 0（每帧都可 seek），配合精确 seek 让回退无阶梯。

4. **消除 forward 播放尾巴**
   - 一旦本帧检测到 `gap < 0`（反向）或 `|gap| < VIDEO_CHASE_EPSILON`，立刻 `pause()` 并把 `playbackRate` 重置到 1，避免上一次 `play()` 的异步 promise 让视频在停止瞬间再走 1–2 帧（这是最直接的"回弹"来源）。

5. **保持不变**
   - shader、UI、burn 曲线、`fire()` 逻辑、burst 阶段锁末帧、visibilitychange 守卫、debug 面板全部不动。
   - `PIXELS_FOR_FULL_PROGRESS`、`MAX_PIXELS_PER_TICK` 保持当前值。

## 技术细节
```text
常量:
  SMOOTH_RATE = 16              // 单一对称速率
  SEEK_COOLDOWN_FRAMES_FWD = 1
  SEEK_COOLDOWN_FRAMES_BWD = 0

RAF loop(dt):
  targetProgress = clamp01(targetProgress + drain(pendingWheelPx)/PIXELS)
  alpha = min(0.45, 1 - exp(-16*dt))
  progress += (targetProgress - progress) * alpha

  # 视频调度
  target_fwd = progress * duration           # 正向以平滑值追
  target_bwd = targetProgress * duration     # 反向以原始意图追
  if lockFinalFrame: pause + 锁 duration
  elif gap_fwd > +ε: playForward(rate=1+gap*6)
  elif gap_bwd < -ε:
      pause(); playbackRate=1
      commitSeek(target_bwd, exact=true)    # 每帧都 seek
  else:
      pause(); playbackRate=1
```

## 验收
- 反向滚动过程中和停止瞬间，视频帧号严格单调下降，无任何前进帧闪现。
- 正向手感与当前一致。
- burst 阶段来回滚动仍平滑；无白/闪屏；构建通过。