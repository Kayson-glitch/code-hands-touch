## 目标
1. 让 mosaic tile → ASCII 字符之间的过渡更柔和，不再出现 alpha > 0.55 的"硬切换"。
2. 增加边缘不规则度（比上一版更破碎，但仍以圆为基）。
3. 略微加大 reveal 尺寸。

## 改动（仅 `src/components/AsciiHandsFooter.tsx`）

### 1. 加大尺寸
- `GOOEY_RADIUS_UV` 0.0376 → 0.048（直径由 ~80px → ~100px）。
- `GOOEY_SOFTNESS_UV` 0.020 → 0.028（柔化带同步加宽，避免边缘变生硬）。

### 2. 加强边缘不规则（在近圆基础上恢复一部分破碎，但不回到原来的墨溅程度）
- `GOOEY_NOISE` 0.006 → 0.011。
- `midFreq` 系数 × 1.2 → × 2.6，并叠加第二个更低频波 `sin(localI*0.15 + localJ*0.42 + seed*3.1) * GOOEY_NOISE * 3.0`，得到大小两级的不规则起伏。
- `highFreq` × 0.15 → × 0.35，`microFract` × 0.1 → × 0.2（细颗粒回归，但仍克制）。
- `ARM_ALIGN_STRENGTH` 0.25 → 0.45，让不规则沿手臂方向更明显。

### 3. 平滑 mosaic → ASCII 过渡（消除硬切换）
关键点：目前 `mosaicCovered = mosaicAlpha > 0.55` 是布尔硬阈值，>0.55 时字符完全不画、≤0.55 时字符正常画 → 出现明显跳变。改为连续混合：
- 引入 `glyphAlpha = 1 - smoothstep(0.35, 0.85, mosaicAlpha)`（0..1 平滑过渡）。
- 字符绘制时使用 `ctx.globalAlpha = glyphAlpha`（绘制完恢复），删除 `mosaicCovered` 布尔分支。
- mosaic tile 本身的 alpha 曲线也从线性 `min(1, gooey*1.35)` 改为 `smoothstep(0, 1, gooey) ** 0.85`，让中心饱满、边缘更缓地淡出，与字符层自然交叠。
- 边缘 tile 尺寸抖动扩大：`MOSAIC_SCALE_MIN` 0.88 → 0.78，`MOSAIC_SHATTER_PX` 1.5 → 2.5，`MOSAIC_SPLATTER_PROB` 保持，配合更宽的柔化带形成"碎片渐渐消散"的观感。

### 4. 验证
Playwright 静止 / 慢移 / 快移三态截图，确认：
- 直径约 100px；轮廓明显不规则但仍是"圆"。
- 从 mosaic 到 ASCII 无肉眼可见硬边，边缘 tile 逐渐变小、变淡，字符透明度相应上升。
- 其它效果（跟随、视差、字符倾斜、生长动画、紫色主题）无变化。
