## 目标
把当前鼠标移入 reveal disc 的边缘从"规则圆 + 轻微波动"进一步推向"毛糙、破碎、像墨水在纸上扩散"，同时保持明暗跟随和整体尺寸不变。

## 改动内容
1. **增大噪声幅度**
   - `GOOEY_NOISE` 从 `0.011` 提升到 `0.018`。
   - 低频 blob（`seed` 驱动）幅值 `GOOEY_NOISE * 1.5`。

2. **叠加多层空间噪声**
   - 中频平滑坐标波：使用 `Math.sin(i * 0.45 + j * 0.35 + seed * 1.5)`，幅值 `GOOEY_NOISE * 5`，制造可见的破碎 lobes。
   - 高频 hash：使用 `fract(sin(seed * 45.7) * 123.45)`，幅值 `GOOEY_NOISE * 1.0`。
   - 更高频微小抖动：使用 `fract(sin(seed * 137.9) * 437.58)`，幅值 `GOOEY_NOISE * 0.5`。

3. **保持时间节奏缓慢，避免闪烁**
   - 时变 wobble 仍然只使用 `timeSec * 0.5` 低频正弦，幅值控制在 `GOOEY_NOISE * 0.6` 左右。
   - 破碎感由空间噪声主导，而非快速时间抖动。

4. **保留软过渡，避免锯齿**
   - 不改变 `GOOEY_SOFTNESS_UV`（`0.023`）和 smoothstep 过渡逻辑，确保边缘虽有起伏但仍是逐像素柔化，不会出现硬锯齿。

5. **不改动**
   - 盘大小 `GOOEY_RADIUS_UV = 0.0376`（80px 等效）
   - 盘位置对鼠标的 lerp 跟随
   - 明暗关系加权 `lumaWeight`
   - 基础颜色、字体、采样

## 验证
- `bun run build` 通过。
- Playwright 截图：在手掌不同区域 hover，确认边界呈现明显的不规则毛边与碎裂块，深阴影处仍保持低亮度，没有高频闪烁或明显锯齿。

## 交付物
- 更新后的 `src/components/AsciiHandsFooter.tsx`