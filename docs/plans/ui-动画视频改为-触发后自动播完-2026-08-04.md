# UI 动画视频改为「触发后自动播完」

术语约定：**入场视频** = 开场的 orb/手部实拍视频（`IntroVideo`）；**UI动画视频** = 第一屏点阵手部所用的 49 帧序列（`hands-frames.webp` 雪碧图）。本次只改 UI动画视频的播放方式，入场视频、导航、文案、第二屏、对话条都不动。

## 目标行为

1. 入场视频结束、第一屏 UI 呈现时，UI动画视频停在**第 1 帧**（画面基本空白，手还没伸入）。
2. 首次**滚轮滚动**或**鼠标点击**（任一即可触发，只触发一次）→ UI动画视频**自动从第 1 帧播到最后一帧**，约 2 秒，匀速带轻微缓入缓出。
3. 播完后**永久停在最后一帧**，不循环、不倒退、不再受滚轮影响。
4. 播放期间不再吞掉滚轮：页面滚动照常进行，两者互不干扰（去掉现有的「先滚完手部再滚页面」的滚轮锁）。
5. `prefers-reduced-motion` 下直接显示最后一帧，不播放。

## 技术改动（`src/components/HalftoneHandsFooter.tsx`）

- 移除滚轮/触摸驱动播放头的整段逻辑：`consume()`、`onWheel`、`onTouchStart/onTouchMove`、`progressRef`、`lockSpan()` 及对应的 `preventDefault` 与事件解绑。
- 播放头改为时间驱动：新增 `playbackRef = { startedAt: null }`，在 rAF 循环里按 `elapsed / DURATION` 求进度，经 smoothstep 缓动后映射到 `0 … FRAME_COUNT - 1`，到 1 后钳制并停止推进。新增常量 `PLAY_DURATION = 2000`。
- 触发器：在 `stage === "hands"` 后一次性绑定 `window` 的 `wheel`（passive）与 `pointerdown`，任一触发即写入 `startedAt = performance.now()` 并立刻解绑两个监听。
- 保留现有的帧缓存、采样、反相、方块化暗部、孤点飞散、视差与呼吸逻辑，一行不改。
- `src/routes/index.tsx` 不改（100vh 占位与视差保留）。

## 验收

Playwright：入场后截图确认停在第 1 帧；派发一次 wheel 后延时截图确认手已伸入；2.5 秒后再截图确认停在最后一帧且继续滚动不再改变手部。
