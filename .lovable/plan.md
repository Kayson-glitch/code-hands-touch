## 目标

彻底消除 `IntroVideo` 视频跟随鼠标滚轮时的卡顿 / 顿挫，让正向、反向、快慢混合滚动都保持 60fps 的丝滑反馈。当前实现每帧写 `video.currentTime` 触发 seek，seek 的解码延迟本身就是顿挫的根源 —— 需要从"驱动模型"层面重写。

## 现状问题（已核对源码）

`src/components/IntroVideo.tsx`：

1. 反向滚动走 `commitSeek(targetTime, exact=true)` —— 每帧一次精确 seek，硬解码 keyframe → 每次滚回都会"抖一下"。
2. 前进用 `playbackRate` 追赶，但同时又在大 gap 时 `commitSeek`，`fastSeek` 和 `play()` 交替 → 帧队列被反复丢弃。
3. `videoTex.needsUpdate = true` 只在 seek 时置位。Three 的 `VideoTexture` 默认每次 `render` 就 `texImage2D`，但没有和视频真实"新帧到达"对齐 → 存在"渲染了但纹理还是上一帧"的错位。
4. wheel 事件累积到 `pendingWheelPx`，每 RAF 只 drain `MAX_PIXELS_PER_FRAME=180`，快速滚动时 target 被人为拖慢，给人"粘"的感觉。
5. `PROGRESS_SMOOTH_TIME=0.11` 双通道 smoothing 让 shader 进度和视频进度分离，视觉上出现"UI 已经动了但视频还没动"的滞后。

## 方案

一次性替换掉 seek-based 驱动，改成 **rVFC 帧回调 + 单向 playbackRate 追赶 + 大 gap 才 seek** 的模型。

### 1. 帧同步：使用 `requestVideoFrameCallback`

- 在 `video` 上注册 `requestVideoFrameCallback((now, meta) => { videoTex.needsUpdate = true; ... })`，只在解码器真的吐出新帧时才标记纹理更新；渲染循环里删除无条件的 `needsUpdate`。
- 用回调里的 `meta.mediaTime` 作为"当前视频时间"的权威来源，替代读取 `video.currentTime`（后者在 seek/play 混合时会跳）。
- 降级：不支持 rVFC 的浏览器回退到现在的 `currentTime` 读取。

### 2. 驱动模型：playbackRate 主导，seek 仅救火

- 正向：用 `playbackRate ∈ [0.25, 4]`，按 `gap` 做 PD 控制器（比例 + 阻尼），让视频"平滑追上"目标时间，不再动 `currentTime`。
- 反向：**不再每帧 seek**。改为：
  - 小回退（gap > -0.35s）：把 `playbackRate = 0`（暂停），等目标追上；如果长时间不追上，才 seek。
  - 大回退：单次 `fastSeek` 到目标 -0.05s，之后交给正向追赶。
- 巨大跳变（> 1.2s）：一次 `fastSeek`，seek 期间用最近一帧继续渲染，不再排 queue，也不再 "exact seek"。
- 移除 `seekInFlight` / `queuedSeekTarget` / `SEEK_COOLDOWN_FRAMES_*` / `VIDEO_HARD_SEEK_EPSILON` 这一整套复杂状态机。

### 3. 输入 → 目标的映射：无损累积 + 单通道 smoothing

- 移除 `MAX_PIXELS_PER_FRAME` drain 限制（保留 `MAX_PIXELS_PER_TICK` 反刺）；累积到的 wheel px 每帧全部注入 target，避免快速滚被人为拖慢。
- 合并 `progress` / `videoDriverProgress` 为单一 smoothed progress，消除 shader 和视频的相位差。
- `PROGRESS_SMOOTH_TIME` 从 0.11 降到 0.05，让"手感响应"贴近手，长距离的平滑靠 playbackRate 追赶完成。

### 4. 触摸板 / 高频事件的处理

- wheel 事件仍 `passive: false + preventDefault`，但改为在 `pointer` capture 阶段直接累加，避免 React 层重排。
- 用 `event.deltaX` 忽略（防止触摸板横向滚动干扰）；`Math.sign(dy)` 变化时清零上一帧残留速度，方向切换零延迟。

### 5. 渲染循环成本

- `renderer.render` 只在下列任一条件成立时执行：`videoTex` 有新帧 / `progress` 变化 > 阈值 / `burnActive`；空闲时跳过 GL 提交，把 GPU 让给浏览器合成器，减少滚动卡顿的另一来源。

## 技术细节区（不面向用户）

```text
新驱动状态机
------------------------------------------
input:
  wheelPx --(累积, 单tick截断)--> targetProgress
  targetProgress --(critically damped, τ=0.05)--> progress
tick:
  targetVideoTime = f(progress)
  gap = targetVideoTime - mediaTime
  if |gap| > 1.2: fastSeek(targetVideoTime - 0.05)
  elif gap >  0.03: playbackRate = clamp(1 + gap*4.5, 0.75, 4)
  elif gap < -0.35: fastSeek(targetVideoTime)
  elif gap < -0.03: playbackRate = 0 (pause)
  else:              playbackRate = 1, pause if idle
render:
  if (newFrameArrived || |progressΔ| > ε || burnActive)
    renderer.render()
```

改动仅在 `src/components/IntroVideo.tsx` 内部；对外 API（props、事件）保持不变，`IntroPreloader` handoff 逻辑不动。

## 验收

- 慢速正向滚：视频与滚轮 1:1 贴合，无"过冲后回弹"。
- 快速正向滚：视频用 playbackRate 追上，不再断断续续。
- 反向缓慢滚：不再每帧硬 seek，画面平滑倒放。
- 反向快速滚：单次 seek + 之后自动追赶，无频闪。
- 方向反转：< 1 帧延迟切换。
