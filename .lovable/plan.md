## 目标

修复两个问题：
1. 扩散当前从屏幕正中心出发，应改为从视频最后一帧中"两手指尖相接"的位置出发。
2. 扩散阶段视频被立即卸载 + 露出米色底，出现"纯色背景覆盖在视频上"的观感；应让视频停在最后一帧作为背景，直到爆发完全覆盖屏幕再切走。

## 改动

### 1. `src/components/IntroVideo.tsx`
- 结束时不再靠 `onEnded` 立即让父组件卸载。改为：
  - 到达最后一帧时暂停视频（`v.pause()`）并显式 seek 到 `duration - 0.01`，让画面稳定停在最后一帧。
  - 向父级回调传出前景视频的显示 rect（`getBoundingClientRect`）与内在尺寸（`videoWidth/Height`），用于计算指尖屏幕坐标。
- 签名调整为 `onEnded(info: { videoRect: DOMRect; videoW: number; videoH: number })`。

### 2. `src/components/AsciiHandsFooter.tsx`
- 新增常量：指尖在视频内在坐标系中的相对位置（两指相接中心），默认 `FINGER_UV = { x: 0.5, y: 0.5 }`（后续如需微调只改这一处）。
- `handleOrbClick` 接收 `IntroVideo` 传来的 rect/尺寸，按 `object-fit: contain` 的规则计算前景视频在视口中的实际绘制矩形（letterbox），再把 `FINGER_UV` 映射为屏幕像素 → 归一化 UV，作为 `burstOrigin`。
- 移除"视频结束立即 `handleOrbExited` 卸载"的逻辑。改为：
  - 进入 `orb-burst` 时保留 `orbMounted = true`，让 `IntroVideo`（停在最后一帧）继续作为爆发下方的背景。
  - 在 `handleBurstCovered`（爆发完全覆盖屏幕的那一帧）里再 `setOrbMounted(false)`，同时 `setBgDark(true)`。
- 保留现有 `bgDark` 切换，确保爆发覆盖后才切到深色底，避免米色闪现。

### 3. 视觉验证
- 用 Playwright 触发视频结束 → 观察爆发是否从指尖位置扩张、扩散过程中视频是否始终在下方可见、覆盖完成后是否平滑过渡到手部阶段。
- 如指尖不完全在视频中心，可通过调整 `FINGER_UV` 微调一次即可。

## 不改动

- `LiquidBurst` 组件本身、扩散时长、弹性曲线、边缘不规则度、颜色、后续手部动画、层级设定均保持不变。