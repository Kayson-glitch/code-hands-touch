## 目标
把当前鼠标移入时的揭示盘从"略带噪声的圆"改成"更破碎、更像有机边缘/墨水扩散"的形状，同时保留盘位置、大小（80px 等效）和明暗跟随关系。

## 改动内容
1. 增强边缘噪声
   - 在 `src/components/AsciiHandsFooter.tsx` 的逐 cell 距离计算里，把现有 `GOOEY_NOISE` 驱动的噪声幅度提高，并叠加一层更高频的 hash 噪声，使边界变得毛糙而不只是轻微波动。
   - 保持基础半径和 softness 不变，只让 effective 边界更不规则。

2. 避免时间抖动过强
   - 噪声的时变分量（wobble）调低频率但加大空间方差，避免看起来像"闪烁"，而是像缓慢的墨水扩散。

3. 不改动
   - 盘大小（GOOEY_RADIUS_UV = 0.0376，等效 80px）
   - 盘位置对鼠标的 lerp 跟随
   - 明暗关系加权（lumaWeight）
   - 基础颜色、字体、采样

## 验证
- `bun run build` 通过
- Playwright 截图：在手掌不同区域 hover，确认边界呈现明显的不规则毛边，深阴影处仍保持低亮度，无明显闪烁或卡顿

## 交付物
- 更新后的 `src/components/AsciiHandsFooter.tsx`