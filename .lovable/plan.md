目前 `src/components/IntroVideo.tsx` 中控制「滚轮 → 播放进度」手感的时间参数全部集中在文件顶部，下面按功能分组列出当前值和作用：

## 1. 滚轮输入层
| 参数 | 当前值 | 作用 |
|---|---|---|
| `VIDEO_FRACTION` | `0.6` | 总滚动进度中，前 60% 分配给「视频播放」，后 40% 分配给「burst 扩散动画」。 |
| `PIXELS_FOR_FULL_PROGRESS` | `3200` | 从滚动进度 0 到 1 所需的累计滚轮像素。值越大，需要滚得越多才能播完。 |
| `MAX_PIXELS_PER_TICK` | `140` | 单次 `wheel` 事件最大计入的像素，防止一次猛滚跳太多。 |
| `WHEEL_BUFFER_MAX` | `360` | 滚轮缓冲区上限，超过此值的多余滚动会被截断。 |
| `WHEEL_RELEASE_RATE` | `18` | 滚轮缓冲按指数衰减释放到目标进度的速度。越大，单次滚轮刻度的能量释放越快。 |

## 2. 平滑追赶层
| 参数 | 当前值 | 作用 |
|---|---|---|
| `SMOOTH_RATE` | `16` | 正常/小差距时的指数平滑速率（低 = 惯性大）。 |
| `SMOOTH_RATE_FAST` | `26` | 目标差距大时额外增加的平滑速率，让快速滚动更跟手。 |

## 3. 视频 seek / 播放策略层
| 参数 | 当前值 | 作用 |
|---|---|---|
| `SEEK_MIN_INTERVAL_MS` | `140` | 两次 `seek` 之间的最小间隔，避免频繁 seek 导致卡顿。 |
| `SEEK_EPSILON` | `0.1` | 当前时间与目标时间差距超过此值（秒）才允许 seek。 |
| `VIDEO_CHASE_EPSILON` | `0.035` | 当目标在当前时间前方，且差距小于此值时，用「播放追赶」而不是 seek。 |
| `VIDEO_BACKWARD_SEEK_EPSILON` | `0.12` | 当目标在当前时间后方（回滚），且差距超过此值时，直接 seek 回去。 |
| `VIDEO_HARD_SEEK_EPSILON` | `0.48` | 当目标差距超过此值时，视为大跳，先 seek 到目标附近再播放追赶。 |
| `MIN_CHASE_PLAYBACK_RATE` | `0.75` | 播放追赶时的最小倍速。 |
| `MAX_CHASE_PLAYBACK_RATE` | `2.35` | 播放追赶时的最大倍速。 |

## 4. 父组件通知层
| 参数 | 当前值 | 作用 |
|---|---|---|
| `PROGRESS_NOTIFY_EPSILON` | `0.003` | 进度变化超过此值才通过 `onProgress` 通知父组件，减少 React 重渲染。 |

## 5. 运行时常量
- 帧时间 `dt` 被 clamp 到 `[0.001, 0.05]` 秒，避免 tab 切换后的大跳变。
- 当 `targetProgress` 与 `progress` 差距小于 `0.0005` 时直接 snap，保证 `progress >= 1` 能干净触发 `fire()`。

## 调整建议方向
- 想要更「丝滑但跟手」：降低 `SMOOTH_RATE` / `SMOOTH_RATE_FAST`，并缩小 `SEEK_MIN_INTERVAL_MS`。
- 想要更「直接响应」：提高 `SMOOTH_RATE`，降低 `PIXELS_FOR_FULL_PROGRESS`。
- 想要减少卡顿：提高 `SEEK_MIN_INTERVAL_MS`、放宽 `VIDEO_CHASE_EPSILON` 让播放追赶代替 seek。
- 想要调整视频与扩散的占比：改 `VIDEO_FRACTION`。

你可以直接告诉我每个参数想改成多少，我按你的值只修改 `IntroVideo.tsx` 顶部常量，不改动其他逻辑。