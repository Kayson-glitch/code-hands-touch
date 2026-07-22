把 `Synergy.AI.` 渐变文字从当前生硬的「线性无限平移」改成柔和、可呼吸的缓动流动。

## 改动内容

1. **更新 `src/styles.css`**
   - 替换 `@keyframes synergy-gradient-flow`。
   - 新动画在约 0% 位置停留，缓慢移动到约 35% 左右，再缓慢返回，整体使用 `ease-in-out` 或自定义 `cubic-bezier(0.45, 0, 0.55, 1)`，让运动有自然的加速/减速，没有线性机械感。
   - 单个周期 8–10s，更舒缓。

2. **更新 `src/components/HeroCopy.tsx`**
   - 保持三色渐变值不变（#185DFF、#D018FF、#FF1245）。
   - 把 `animation: "synergy-gradient-flow 6s linear infinite"` 改为新的 keyframe + 更慢时长。
   - 可选增加非常轻微的 `brightness` 呼吸，让整体发光感更柔和，但只作为辅助，不抢戏。

3. **验证**
   - 构建项目检查 TypeScript/CSS 是否通过。
   - 在预览中确认渐变不再像进度条一样平移，而是缓慢来回、呼吸感强。

## 技术细节

- 使用 CSS keyframes 控制 `background-position` 在 `0%` ↔ `35%` 之间移动。
- 关键帧 0% → 30% → 70% → 100% 营造「停留-慢移-慢回-停留」的呼吸节奏。
- `animation-timing-function` 用全局 ease-in-out，避免 linear。