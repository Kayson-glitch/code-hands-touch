## 目标

优化 `LiquidBurst` 的墨迹扩散动效：更慢、更有弹性、边缘更破碎。

## 修改点（仅 `src/components/LiquidBurst.tsx`）

### 1. 放慢 + 弹性缓动
- `spreadMs` 默认 1000 → **1600ms**。
- 缓动从 `easeOutCubic` 换成**弹性 easeOutBack**：
  ```
  const c1 = 1.70158;
  const p = 1 + (c1 + 1) * Math.pow(rawP - 1, 3) + c1 * Math.pow(rawP - 1, 2);
  ```
  半径会略微"越过"再回弹，产生弹性感。
- 覆盖判定用 `rawP >= 1`（保持不变），但由于 easeOutBack 会先冲过 100% 再回来，观感是"啪"地扩到位后微微一顿。

### 2. 边缘更不规则
- **turbulence 频率降低 + octave 增加**：`baseFrequency="0.006 0.010"`、`numOctaves={3}`（更大颗粒的破碎，替代当前偏细腻的 `0.012 0.018` / 2 octaves）。
- **displacement scale 大幅上调**：从 `10 → 60` 改为 `20 → 120`，扩散过程中前沿撕裂更强。
- **feather（羽化带）加宽**：从 `6 + (1-p)*6` 改为 `10 + (1-p)*14`，让边缘的过渡更"脏"、更墨渍。
- **seed 更新更快**：从每 90ms 改为每 60ms，湍流流动更活跃，边缘持续变形不呆板。

### 3. `AsciiHandsFooter.tsx` 不改
- `handleBurstProgress` 里 `p >= 0.6` 触发 hands 的阈值保持不变；因为扩散更慢，hands 生长的启动点自然也延后（0.6 * 1600ms ≈ 960ms），整体节奏更从容。若感觉太慢再单独下调阈值。

## 验证
Playwright 打开首页 → 点击球体 → 每 120ms 截图连续 2.0s，确认：
1. 扩散明显变慢（~1.6s 覆盖全屏）
2. 到达边界时有轻微"越界回弹"的弹性感
3. 墨迹边缘更破碎、更不规则，色散边更明显
4. 无 `Context Lost`，hands 阶段正常衔接
