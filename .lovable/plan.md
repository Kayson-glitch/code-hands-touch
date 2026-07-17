## 改动 `src/components/AsciiHandsFooter.tsx`

### 1. 揭示盘 68px → 80px
`GOOEY_RADIUS_UV`: `0.032` → `0.0376`（按 80/68 比例缩放；softness/noise 保持不变）。

### 2. 移入效果跟随明暗关系
当前问题：盘内所有 cell 的 scramble + 高光 tint 都按同一个 `sharp` 应用，导致原本很暗的区域也被"点亮"，破坏了轮廓的明暗层次。

改法：让 tint 与 scramble 的强度都乘上 cell 本身的亮度权重 `c.b`，暗的地方几乎不亮起、亮的地方充分反应。给一个下限保底避免全黑消失：

```ts
// b^0.6 让中亮区仍有明显反应，深阴影几乎不变
const lumaWeight = Math.pow(c.b, 0.6);
const sharpL = sharp * lumaWeight;

// scramble 幅度也按亮度权重缩放（暗处不抖）
const scrambleOffset = Math.floor(
  (scramble - 0.5) * RAMP_LEN * 0.25 * sharpL,
);
// ...
r += (HR - r) * sharpL;
g += (HG - g) * sharpL;
bl += (HB - bl) * sharpL;
```

即：盘的位置/大小/软度不变，只是盘内的"揭示强度"按底图明暗调制——暗处保持暗，亮处才被 tint 抬高。

## 不改动
- 盘位置的 lerp 跟随（上一轮）
- 视差、字体、颜色基色
- 轮廓采样、明暗结构本身

## 验证
`bun run build` 通过；Playwright 把光标放到手部深阴影处 vs 高光处各截一图，确认深阴影几乎无变化，高光处清晰变亮，整体明暗层次保留。
