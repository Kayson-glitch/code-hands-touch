## 根因

`IntroVideo` 的外层容器 `zIndex: 60`，而 `LiquidBurst` 是 `zIndex: 55`。上一轮把视频保留在爆发下方以后，视频反而盖住了爆发层，看起来"完全没有扩散"。

## 改动

### `src/components/LiquidBurst.tsx`
- 把根容器 `zIndex` 从 `55` 提到 `70`，确保爆发绘制在保留的视频（`zIndex 60`）之上、ASCII canvas（`zIndex 10`）之上，但仍低于以后可能新增的更高层 UI。

不改其他任何行为、时长、颜色、几何。改完用 Playwright 触发视频结束，截 3 帧（0.4s / 1.2s / 2.4s）确认扩散可见并从指尖位置发出。