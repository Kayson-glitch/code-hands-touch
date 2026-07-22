## 目标
为开场视频增加鼠标移入时的轻微视差效果。

## 方案
在 `src/components/IntroVideo.tsx` 中：

1. 在视频容器上监听 `mousemove` / `mouseleave`，将鼠标相对容器中心的位置归一化为 `(-1, 1)` 范围。
2. 使用 `requestAnimationFrame` + lerp 平滑跟随（factor ≈ 0.08），避免抖动。
3. 将平滑后的偏移量以 CSS transform 施加在视频层：
   - 位移：最大 ±12px
   - 轻微 3D 倾斜：`rotateX` / `rotateY` 最大 ±2deg
   - 容器加 `perspective: 1200px`
4. 保持现有的 zoom / 故障 / 光圈 shader 效果不变，视差只作用在视频 DOM 层的外层 wrapper transform 上，不影响 WebGL 采样。
5. 鼠标离开时平滑回到中心 (0,0)。
6. 扩散阶段（burnProgress > 0）时逐渐衰减视差强度到 0，避免与黑孔扩张冲突。

## 技术要点
- 只改 `IntroVideo.tsx`，不动其他组件。
- 视差 wrapper 与 canvas 共享同一 transform 层，或单独包一层 div，确保 shader 采样区域一致。
- 使用 `will-change: transform` 优化性能。
