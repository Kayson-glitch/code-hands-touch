## 修复淡紫闪屏 + 调整时长

### 原因
burn 启动瞬间 `b` 从 0 跳到很小值，此时 `rOuter ≈ 0`，`dOuter = len(p)`，halo 项 `exp(-|dOuter|*4.5)*0.55` 在屏幕中心区域仍产生明显淡紫色，导致第一帧全屏泛紫闪一下。

### 修改（仅 `src/components/IntroVideo.tsx`）

1. **消除启动闪屏**
   - 在着色器合成前引入淡入系数 `float appear = smoothstep(0.0, 0.12, b);`
   - `ring` 与 `halo` 均乘以 `appear`，让光圈从 0 平滑起。
   - 额外要求 `rOuter > 0.02` 才让 halo 生效（用 `smoothstep(0.02, 0.08, rOuter)` 门限），避免中心区域被辐射覆盖。

2. **时长调整**
   - `BURN_DURATION_MS` 从 `1600` 改为 `2600`。

### 不变项
时序流程、扩散曲线、颜色、环宽、外晕层数、触发/锁定逻辑均保持。
