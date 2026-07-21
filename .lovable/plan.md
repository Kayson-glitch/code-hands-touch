## 根因
`LiquidBurst` 单层墨盘外部透明，整层被 `feDisplacementMap` 按 scale=120 位移。位移把圆外透明像素往内拉，撕出大波浪的透明湾，section 米底 `#EFE7DA` 从缝里透出 → 米色波浪边。米底本身不能去（orb-burst 需要浅底衬黑墨）。

上一版加实心黑底把内部填死，扩散中段变成纯黑矩形 → "中间黑屏"。

## 修改（只动 `src/components/LiquidBurst.tsx`，直接修位移量）

1. 回滚实心黑底：删掉 `solidRef` / `inkRef` 结构，`wrapRef` 恢复直接挂 `filter`，三层彩色渐变结构与之前一致。
2. `displace` 由 `20 + p*100`（上限 120）→ `12 + p*22`（上限 ~34），位移只够揉出细齿，不足以撕出米色湾。
3. `feather` 由 `10 + (1-p)*14`（10–24%）→ `4 + (1-p)*6`（4–10%），配合小位移消除可见羽化带。
4. `feTurbulence baseFrequency` 由 `0.006 0.010` → `0.012 0.018`，噪声更细密，边缘呈毛刺而非波浪。

## 不改动
`spreadMs=2600`、`fadeMs=280`、easeOutBack、色相、多层混合、`AsciiHandsFooter.tsx` 的阶段机与 bg 切换时机全部不动。

## 验证
Playwright 打开首页 → 点球体 → 每 150ms 截图 3s：
1. 扩散过程边缘为细密毛刺，无米色波浪缝；
2. 中间无纯黑矩形长时间停留，湍流墨感贯穿全程；
3. covered→fade→hands 时序未变，无 WebGL Context Lost。
