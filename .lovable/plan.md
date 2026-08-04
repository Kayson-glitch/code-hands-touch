# UI动画视频改回「滚轮驱动 + 滚动锁」

只改 UI动画视频（第一屏 49 帧点阵手部）的播放控制。入场视频、导航、文案、第二屏、对话条、点阵渲染风格都不动。

## 目标行为

1. 入场视频结束、第一屏 UI 呈现时，UI动画视频停在第 1 帧（空白画面，手还没伸入）。
2. 向下滚轮 → 先驱动视频帧前进，此时页面不滚动（滚轮被拦截）。
3. 帧号到最后一帧后，滚轮交还给页面，页面正常向下滚动。
4. 可回滚：页面回到顶部后继续向上滚 → 视频从最后一帧倒退回第 1 帧。
5. 帧号做缓动插值，避免滚轮离散跳跃感。
6. `prefers-reduced-motion` 下直接显示最后一帧，不拦截滚轮。

## 技术改动（`src/components/HalftoneHandsFooter.tsx`）

- 移除一次性时间驱动播放：删掉 `playback.startedAt`、`PLAY_DURATION`、`start()`/`onTrigger` 及其 `wheel`/`pointerdown` 绑定。
- 新增 `progressRef`（0…1 播放进度）与滚轮消费逻辑 `consume(deltaY)`：
  - 归一化 `deltaMode`（行/页 → px）；
  - `progress += dy / LOCK_SPAN`，其中 `LOCK_SPAN` 取视口高度的一个倍数（约 1.0×100vh），并 clamp 到 0…1；
  - 只有当「向下滚且 progress < 1」或「向上滚且 progress > 0 且页面已在顶部（`scrollY <= 0`）」时才 `preventDefault()` 吞掉滚轮；否则不拦截，页面照常滚动。
- 用非 passive 的原生 `wheel` 监听器（React `onWheel` 是 passive，`preventDefault` 无效），绑在 `window` 上，回调走 ref 避免闭包过期。
- 触摸端同样处理：`touchstart` 记起点，`touchmove` 用位移差喂给同一个 `consume()`，条件满足时 `preventDefault`。
- 播放头：`target = progress * (FRAME_COUNT - 1)`，`current` 按现有 `FRAME_EASE` 追赶 target；渲染取 `Math.round(current)`。
- 保留现有帧缓存、采样、反相、方块化暗部、孤点飞散、视差与呼吸逻辑，一行不改。
- 卸载时解绑 `wheel`/`touch*` 监听。

## 验收

Playwright：入场后截图确认停在第 1 帧；连续派发向下 wheel 事件，确认 `scrollY` 先保持 0、手部逐步伸入；帧满后再派发 wheel 确认 `scrollY` 开始增大；回到顶部向上滚确认手部倒退。
