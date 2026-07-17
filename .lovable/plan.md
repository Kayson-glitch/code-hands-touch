## 目标
把移入延时加长，并把 intensity 上升过程改成更自然的缓动曲线（当前是线性递增，容易在开始/结束显得突兀）。

## 改动位置
仅 `src/components/AsciiHandsFooter.tsx` 顶部常量 + draw 循环里 intensity 的更新逻辑。

### 1. 延时加长
```ts
const INTENSITY_IN_DELAY_MS = 120; // → 220
const INTENSITY_IN_MS = 200;        // → 360
```
`INTENSITY_OUT_MS = 250` 保持不变（移出仍然干脆）。

### 2. 缓动曲线（ease-out cubic）
当前直接对 `intensity` 做线性 `+step`。改成维护一个线性进度 `intensityT ∈ [0,1]`，intensity 由 `easeOutCubic(intensityT)` 映射得到：

```ts
let intensityT = 0; // 线性进度

// 每帧：
if (target > 0) {
  hoverDwellMs += dt;
  if (hoverDwellMs >= INTENSITY_IN_DELAY_MS) {
    intensityT = Math.min(1, intensityT + dt / INTENSITY_IN_MS);
  }
} else {
  hoverDwellMs = 0;
  intensityT = Math.max(0, intensityT - dt / INTENSITY_OUT_MS);
}
// easeOutCubic：起步略快、收尾平滑，避免线性带来的"到位一瞬间停住"的卡顿
const t = intensityT;
intensity = 1 - Math.pow(1 - t, 3);
```

这样：
- 移入光标 → 220ms 无变化
- 之后 360ms 内以 ease-out cubic 平滑长到 1
- 移出仍按 250ms 线性淡出（快速回落，符合手感）

## 不改动
- 揭示盘半径 / softness / noise（68px）
- 明暗保留逻辑（上一轮改动）
- 视差、颜色、字体

## 验证
`bun run build` 通过；Playwright 在光标进入后 100ms / 250ms / 500ms 三个时间点截图，确认 100ms 时基本无揭示，250ms 时开始出现（较弱），500ms 时几乎到位，曲线感自然。
