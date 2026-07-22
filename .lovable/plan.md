## 目标
将 `src/components/IntroVideo.tsx` 的滚轮输入迁移到"输入累积 + RAF 单点插值"模型，消除高频 wheel 事件抖动与丢帧感。

## 现状问题
- `onWheel` 直接写 `targetProgress`：高频触控板事件（120–240Hz）在同一帧内多次更新目标值，但缓动只在 RAF 里跑一次，节奏不稳。
- 缓动只有一层 (`target → progress`)，没有对"原始输入速度"做归一化，快速滚动的 delta 分布不均导致视觉顿挫。
- 反向 seek 依赖 wall-clock 冷却，与 RAF 帧率解耦，出现跨帧抖动。

## 方案

1. **输入累积到 RAF 边界**
   - `onWheel` 只累加 `pendingWheelPx += dy`（clamp 单 tick），不再直接算 `targetProgress`。
   - 在 RAF loop 顶部一次性把 `pendingWheelPx / PIXELS_FOR_FULL_PROGRESS` 加到 `targetProgress`，随后清零。→ 每帧一次处理，天然节流。

2. **两级插值 (rawTarget → smoothTarget → progress)**
   - `rawTarget`：滚轮累积后的目标（跳变）。
   - `smoothTarget`：对 `rawTarget` 做一次快速指数平滑（rate ≈ 22），去掉高频输入毛刺。
   - `progress`：对 `smoothTarget` 做主缓动（rate ≈ 12，正反对称）→ 最终用于视频/shader。
   - 两级都是 frame-rate independent (`1 - exp(-rate*dt)`)，`alpha` clamp 0.4，snap 阈值 0.0002。

3. **速度感知的自适应插值（对称）**
   - 记录 `wheelVelocity = EMA(|pendingWheelPx| / dt)`。速度高时 `smoothTarget` 的 rate 提升到 30，避免快速滚动时明显滞后；速度低时降到 18，保留细腻感。主缓动 rate 保持恒定，保证正反手感一致。

4. **RAF 对齐的 seek 冷却**
   - `SEEK_MIN_INTERVAL_MS` 改为按帧计数（`seekCooldownFrames`，默认 1）：每次 seek 后至少跳过 1 帧，避免与浏览器解码抢帧；替换现在的 wall-clock 判断。

5. **RAF 生命周期健壮性**
   - 使用 `document.visibilityState` 监听：切到后台时暂停 loop 并冻结 `lastFrameTs`，回前台首帧 `dt` 归零，避免长时间累积后一次性追赶造成跳变。

6. **保持不变**
   - shader、UI、burn 曲线、视频 cover-fit、debug 面板、`fire()` 逻辑与阈值均不动。
   - burst 阶段仍锁定视频末帧，`uBurn` 直接跟随 `progress`。

## 技术细节
```text
onWheel(e):
  pendingWheelPx += clamp(dy, ±MAX_PIXELS_PER_TICK)

RAF loop(dt):
  rawTarget   = clamp01(rawTarget + pendingWheelPx / PIXELS_FOR_FULL_PROGRESS)
  wheelVel    = EMA(|pendingWheelPx| / dt, 0.25)
  pendingWheelPx = 0
  fastRate    = lerp(18, 30, clamp01(wheelVel / 4000))
  smoothTarget += (rawTarget - smoothTarget) * (1 - exp(-fastRate*dt))
  progress    += (smoothTarget - progress)  * (1 - exp(-12*dt))
  # ... 现有视频 seek / shader uniform 更新
```

## 验收
- 触控板高频快速滚动：视频/burn 平滑跟随，无锯齿或跳格。
- 慢速微调：进度细腻可控，无抖动。
- 切到后台再回来：不出现瞬间跳跃。
- 反向滚动仍与之前一致的丝滑度。
- 构建无 TS 错误。