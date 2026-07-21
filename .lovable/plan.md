## 诊断

hover 揭示盘的半径当前是 `GOOEY_RADIUS_UV(0.048) × min(canvasW, canvasH)`，也就是**跟随画布短边缩放**。上一次布局调整把 `handsHeight` 从 `45vh` 改成 `51vh`，并给画布加了 `min(100vw, 1440px)` 上限，导致 `minWH` 在不同视口下变化：

- 之前 1440×900 场景：min(1440, 405) = 405 → 直径 ≈ 39px
- 现在同视口：min(1440, 459) = 459 → 直径 ≈ 44px
- 更宽屏幕上画布被限到 1440，短边可能更小 → 直径更小

看起来"变小"其实是这种**跨视口飘忽**的观感（尤其在窗口尺寸变化后），本质原因是 hover 盘半径耦合了画布尺寸。

## 方案

把 hover 揭示盘的半径改为**固定像素**（80px 直径，即用户之前校准的值），不再依赖 `minWH`：

`src/components/AsciiHandsFooter.tsx`

- 新增常量：`const GOOEY_RADIUS_PX = 40;`（半径，直径 80px），`const GOOEY_SOFTNESS_PX = 24;`
- 在渲染循环内把 `R`/`S` 换成 UV 空间等价：
  ```ts
  const R = (GOOEY_RADIUS_PX / minWH) * intensity;
  const S = ((GOOEY_SOFTNESS_PX * 0.5) / minWH) * intensity;
  ```
- 删除或保留 `GOOEY_RADIUS_UV` / `GOOEY_SOFTNESS_UV` 常量作为注释参考；不再在渲染中使用。
- `GOOEY_NOISE`（0.011）保持 UV 空间不变，破碎边缘的相对幅度与盘尺寸解耦是可接受的。

其余（点击锁定 mosaic、intro、视差、字符倾斜）都不受影响，因为它们本来就用像素或独立 UV。

## 验证

- 1327×922、1440×900、1920×1080、1280×720 分别 hover，直径应恒为 ~80px。
- resize 窗口时盘尺寸不再跳动。
