## 目标
取消滚轮控制视频进度时的"回弹/惯性延续"感——滚轮停止后 target 就应停止，不再继续释放缓冲。

## 现状
`src/components/IntroVideo.tsx` 里有两层"缓冲"：
1. `wheelBuffer`（第 233、305–340 行）：每次滚轮事件把 delta 累加到缓冲池，每帧按 `WHEEL_RELEASE_RATE` 指数释放到 `targetProgress`。用户停止滚动后缓冲仍在慢慢排空，视觉上就是"还在往前推一段"的回弹感。
2. `progress → targetProgress` 的指数平滑（第 342–350 行）：追赶目标本身，不产生回弹，属于跟手感，保留。

## 修改
仅动 `src/components/IntroVideo.tsx`：

1. 删除 `wheelBuffer` 相关的状态与常量（`WHEEL_RELEASE_RATE`、`WHEEL_BUFFER_MAX`、`wheelBuffer` 变量、loop 内的释放代码块）。
2. `onWheel` 里把 clamp 后的 `dy` 直接累加到 `targetProgress`：
   ```ts
   targetProgress = clamp01(targetProgress + dy / PIXELS_FOR_FULL_PROGRESS);
   ```
3. 其他参数（`SMOOTH_RATE`、`SMOOTH_RATE_FAST`、seek 阈值等）不动，保持现有跟手平滑手感。

## 验证
滚轮滑动时视频跟随；停止滚动 → target 立刻停，progress 短促收敛后静止，没有额外的"继续往前一小段"效果。其他阶段（burst / hover / 手部动画）不受影响。
