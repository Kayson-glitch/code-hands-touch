## 简化 burn 效果，彻底消除闪屏

### 思路
去掉所有可能覆盖全屏的 halo/外晕层——它们即使配了淡入门限，在半径展开过程中仍会波及整个画面产生淡紫泛光。只保留用户想要的"后半部分"：一个从中心扩张的黑色圆孔，孔边缘带一圈细亮的白色光环。

### 修改（仅 `src/components/IntroVideo.tsx`）

1. **删除 halo 相关代码**：`haloInner`、`haloOuter`、`halo`、`outsideBias`、`radiusGate`、`glowCol` 使用与 `col += glowCol * halo * ...` 全部移除。
2. **保留并简化合成**：
   - 黑色圆孔：`burned` 遮罩不变。
   - 亮环：`ringBand` 仍基于 `|dOuter|` 的窄带 smoothstep，仅在孔外边缘可见（`* (1.0 - burned)`）。
   - 环颜色保持近白 `vec3(1.0, 0.98, 1.0)`。
3. **保留** `appear = smoothstep(0.0, 0.12, b)` 让环从 0 平滑起，避免第一帧硬边。
4. **保留** 2600ms 时长与 fbm 边缘扰动。

### 结果
`col = mix(col, black, burned); col = mix(col, ringCol, ring);` —— 画面上永远只有视频、黑孔、以及沿黑孔边缘的一圈细亮环，无任何全屏发光。
