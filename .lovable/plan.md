## 目标
让 mosaic 碎片的"扩散/消散"节奏跟随鼠标速度：慢移时边缘更松散、tile 淡出更绵长；快速划过时边缘更紧、碎片消散更利落，避免拖影或结块。

## 现状
`speedK ∈ [0,1]` 已存在（由 `SPEED_REF` 归一化），当前只驱动 `discLerp` 与 `intensityLerp`。mosaic 参数（`MOSAIC_SHATTER_PX`、`MOSAIC_SCALE_MIN`、alpha smoothstep 窗口 `0.35..0.85`）与字符 `residueAlpha` 淡出窗口 `0.35..0.85` 都是固定值。

## 改动（仅 `src/components/AsciiHandsFooter.tsx`）

### 1. 速度驱动的动态碎片参数
在主循环拿到 `speedK` 后，派生：
- `shatterK = 1 + speedK * 0.9`  慢移基准 1×，快移最多 1.9×
- `scaleMinDyn = MOSAIC_SCALE_MIN + speedK * 0.14`  快移 tile 更饱满，减少破碎感
- `alphaGamma = 0.85 - speedK * 0.25`  快移 gamma 更小 → 中心更快达到饱满
- `fadeLo = 0.35 - speedK * 0.15`, `fadeHi = 0.85 - speedK * 0.20`  快移过渡窗口整体前移且变窄 → 消散更快

### 2. 应用到 mosaic pass
- `MOSAIC_SHATTER_PX` / `MOSAIC_SPLATTER_PX` 乘以 `shatterK`。
- `MOSAIC_SCALE_MIN` 替换为 `scaleMinDyn`。
- `mosaicAlpha = pow(smoothstep(gg), alphaGamma)`。

### 3. 应用到字符残留淡出
- `residueAlpha` 的 smoothstep 区间由固定 `0.35..0.85` 改为 `fadeLo..fadeHi`。

### 4. 速度平滑
`speedK` 已经是每帧新算的原始值，为避免抖动，在循环里维护 `smoothSpeedK`，每帧 `smoothSpeedK += (speedK - smoothSpeedK) * 0.15`，用它驱动上面派生量。

### 5. 验证
Playwright 三态截图 + 一段快速划过录屏帧：
- 静止/慢移：边缘保持松散破碎、mosaic→ASCII 缓慢淡出。
- 快移：碎片更紧凑、消散更快，无明显拖尾结块。
- 中速：自然过渡，无参数跳变。

## 备注
不改动 disc 尺寸、颜色、生长动画、视差、字符倾斜逻辑。
