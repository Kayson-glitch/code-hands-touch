## 目标
让马赛克碎片区域略微更接近原图，同时保留破碎质感。

## 调整（仅 `src/components/AsciiHandsFooter.tsx` 常量）
- `MOSAIC_SCALE_MIN`: 0.78 → 0.88（碎片间隙缩小，覆盖更完整）
- `MOSAIC_SCALE_MAX`: 1.05 → 1.12（中心区块更饱满，减少 ASCII 底色透出）
- `MOSAIC_SHATTER_PX`: 2.5 → 1.8（位移抖动收敛，图像轮廓更连贯）
- `MOSAIC_SPLATTER_PROB`: 0.09 → 0.06（远抛碎片减少，画面更干净）
- `MOSAIC_MASK_THRESHOLD`: 0.06 → 0.04（马赛克区域略微扩展到边缘，减少破洞感）
- 速度自适应项 `scaleMinDyn` 增量 0.14 → 0.10，避免快速移动时反而变糊

## 不改动
- 悬停形状 / 尺寸 / 边缘噪声
- ASCII 流动、视差、倾斜、生长动画
- 采样分辨率与颜色缓冲（保持性能）