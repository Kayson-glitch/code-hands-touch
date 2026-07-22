## 目标
让 burn 光圈扩散过程也由鼠标滚轮控制，方便对着调参面板反复来回预览。调参完毕后可切回自动。

## 现状
- 滚轮 `progress` 分两段：`0 → VIDEO_FRACTION(0.6)` 控制视频，`VIDEO_FRACTION → 1` 目前**未使用**。
- 一旦 `videoProgress >= 1` 就置 `burnActive=true`，随后 `uBurn` 由 `performance.now()` 时间线自动跑到 1 并 `fire()`（进入下一阶段）。

## 改动方案（仅 `src/components/IntroVideo.tsx`）

1. **burn 进度改为滚动驱动**
   - 复用已有的 `burstProgress = (progress - VIDEO_FRACTION) / (1 - VIDEO_FRACTION)`，作为 `uBurn` 的目标值。
   - 保留现有的平滑（`progress` 已经过 `SMOOTH_RATE` 指数平滑），无需再加额外缓动，滚动手感与视频阶段一致。
   - 删除 `burnStartedAt` / `BURN_DURATION_MS` 的时间推进；`uBurn.value = burstProgress`。

2. **调试模式下可来回滚**
   - 新增 `debug` prop（`IntroVideo` 已在上一版加）参与逻辑：
     - `debug=true`：允许 `progress` 在 burn 段内**双向**滚动（向上滚回到视频段也可以），且 `burstProgress >= 1` 时**不触发** `fire()`——一直停在满扩散状态，方便观察终态；只有点击 Debug 面板新增的「Finish」按钮才 `fire()`。
     - `debug=false`（默认/生产）：保持"触发后不可逆"——一旦 `burstProgress > 0` 就锁定 `targetProgress` 只增不减；`burstProgress >= 1` 时正常 `fire()`。
   - 移除 `burnActive` 状态里那段"锁定 targetProgress=1、pause 视频"的逻辑对 debug 的干扰，仅在非 debug 时执行锁定。

3. **视频保持在最后一帧**
   - 无论 debug 与否，`videoProgress >= 1` 时依旧 `pauseVideo()` 并把 `currentTime` 精准 seek 到 `duration`，避免 burn 阶段视频退帧。

4. **Debug 面板补两颗按钮**（`BurnDebugPanel.tsx`）
   - `Jump to Burst`：外部回调把 `targetProgress` 设到 `VIDEO_FRACTION + 0.001`（一键跳到扩散起点）。
   - `Finish`：把 `targetProgress` 设到 1 并允许 `fire()`（退出调试进入下一阶段）。
   - 通过新 prop `onJumpToBurst` / `onFinish` 传入；`IntroVideo` 内实现这两个回调操作内部 `targetProgress` 变量（通过 ref 暴露）。

## 不改动
- 视频段滚动逻辑、平滑参数、seek 策略
- 光圈 shader 效果、颜色、层次
- ASCII hands / preloader / nav / chat dock / hero UI

## 交付效果
- 拖到视频末尾后继续向下滚 → 光圈从指尖逐步扩张；向上滚 → 光圈缩回（debug 模式）。
- 面板参数改动 + 滚动来回，即可对比不同扩散阶段的形状与辉光。
- 调完点 `Finish` 或滚到底部进入 hands 阶段。

需要我按这个方案实施吗？