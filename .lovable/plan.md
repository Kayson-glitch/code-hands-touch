## 目标

让扩散（burn）阶段和前面的视频播放一样，完全由鼠标滚轮驱动：滚就扩、停就停、往回滚就收，不再有任何自动时间推进。

## 现状

- 视频进度（0 → 0.6）已经是"滚轮直接映射 targetProgress"，停即停。
- 扩散阶段（0.6 → 1.0）在生产模式下仍是：滚到视频结束就触发一个基于时间的 `BURN_DURATION_MS` 动画，滚轮停了它也会继续跑完。
- 只有 `?debug=1` 时才是滚轮驱动扩散。

## 改动方案

统一到一条滚轮时间线，去掉生产 / debug 的分支：

1. `src/components/IntroVideo.tsx`
   - 删除 `BURN_DURATION_MS`、`burnStartAtRef`、基于 `performance.now()` 推进 `uBurn` 的 rAF 分支。
   - `uBurn` 始终由滚动进度派生：
     - `videoProgress = clamp(scrollProgress / 0.6, 0, 1)` 继续驱动视频 `currentTime`。
     - `burnProgress = clamp((scrollProgress - 0.6) / 0.4, 0, 1)` 直接写入 `uBurn`。
   - 保留现有滚轮平滑（和视频用同一套 lerp / SMOOTH_RATE），扩散因此天然"停即停、可回滚"。
   - `onEnded` 触发条件改成 `burnProgress >= 1`（滚到底才进入下一屏），并且只触发一次；不再有"视频到 1 就自动烧完"的定时器。
   - `debug` 分支删掉，或仅保留调参面板 UI（面板依旧调 uniforms，但不再单独接管滚轮）。

2. `src/routes/index.tsx` / `src/components/AsciiHandsFooter.tsx`
   - 不需要再区分 `debug` 传参路径；`?debug=1` 只用于显示 `BurnDebugPanel`。

## 交互结果

- 慢滚：光圈缓慢张开；手一停，光圈定住。
- 反向滚：光圈回缩，回到视频最后一帧继续倒放。
- 滚到底：一次性触发进入字符手部动画（不可逆仅体现在"进入下一屏后不再回来"，扩散过程本身完全可逆）。

## 需要你确认

滚到底进入下一屏后，是否允许再向上滚回来看扩散？我默认"进入后不可回退"，若想完全可回退请告诉我。
