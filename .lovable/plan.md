## 目标
把鼠标悬停时"字符替换 + 色调抬亮"的表现，改成**在破碎的 reveal 区域内直接露出原始 hands-pair 图像的马赛克化版本**——像透过一块碎裂的毛玻璃看到底图的样子。字符层依然存在于画面其它区域，只有 disc 内被"打碎的图像块"覆盖。

## 保留不变
- ASCII 渲染主循环、字符流动、halo 描边、intro 生长动画。
- reveal disc 的位置/大小/破碎边缘噪声/lerp 跟随/速度自适应。
- 视差、字符倾斜逻辑（在 disc 外仍生效）。
- 颜色主题（#C5A9FF 紫）、图像资源。

## 方案

### 1. 预计算马赛克底图
图像加载后（`loadImage(...).then` 里），额外准备一张**低分辨率马赛克版本**：
- 用一块 `mosaicCanvas`（离屏），尺寸 = `cols × rows`（与 ASCII 网格一致），把原图 `drawImage` 缩到这个网格 → 每个 ASCII 单元 = 1 个"马赛克像素"。
- 保存这张 canvas 到 ref（`mosaicRef`），并在需要时按 `CELL_W×CELL_H` 放大绘制到主 canvas，就得到天然对齐 ASCII 网格的马赛克像素块。
- 分辨率随窗口 resize 重建。

### 2. 悬停时绘制"破碎马赛克"
在主渲染循环中，计算完 `intensity` 和 disc 位置后、在字符绘制**之前**插入一次遮罩绘制：

```text
for each cell inside disc reveal mask (含边缘破碎噪声):
    m = mosaic mask value ∈ [0,1]    // 复用现有 gooey + 多层噪声计算
    if m > 阈值:
        - 以马赛克像素颜色填充该 cell 矩形
        - 叠加"碎裂"效果：
            · 位置抖动：cell 位置按 seed + 破碎强度做 ±2~4px 偏移，让方块看起来"崩开"
            · 缩放抖动：0.7~1.15 之间随 seed 变化的方块大小
            · alpha = m（保持边缘柔和过渡）
            · 少量方块（seed 触发）刻意向手臂法线方向多偏移几像素，形成"飞溅像素"
```

再在该 cell 里跳过 ASCII 字符绘制（or 用极低 alpha 叠加字符，做混合过渡）——用 `revealMask[cellIdx]` 数组把这两步串起来。

### 3. 保留破碎边缘的一致性
- 直接复用现有的 `lowFreq / midFreq / highFreq / armAxisNoise` 噪声叠加逻辑作为"马赛克蒙版"，这样破碎边缘方向依然沿手臂轴向，与字符版一致。
- disc 中心的方块几乎不抖动，越靠边缘抖动/缩小越剧烈 → 视觉上"从完整像素崩解成飞散的方块"。

### 4. 与其它 hover 效果的关系
- 视差平移：马赛克层跟随 `parallax` 一起偏移（整体 translate），避免与字符层脱层。
- 字符倾斜/tilt：disc 内跳过字符绘制，因此 tilt 只影响 disc 外——不冲突。
- highlight tint / 亮度提升：**移除**（因为现在露出的是真实图像颜色，不再是"点亮字符"）。

### 5. 参数（初值，后续可微调）
```ts
const MOSAIC_SHATTER_PX   = 3;    // 边缘方块最大位移
const MOSAIC_SCALE_MIN    = 0.7;  // 边缘方块最小占比
const MOSAIC_SCALE_MAX    = 1.05;
const MOSAIC_MASK_THRESHOLD = 0.05;
const MOSAIC_SPLATTER_PROB = 0.08; // 飞溅像素概率
```

### 6. 验证
用 Playwright 在 disc 静止 / 慢移 / 快移三种状态截图，确认：
- 静止：disc 内是清晰的原图像素方块。
- 边缘：方块崩开、错位、缩小。
- disc 外：仍是原来的字符 + 流动效果。
- 视差/生长/流动均不受破坏。

## 技术备注
- 新增依赖：无。
- 变更集中在 `AsciiHandsFooter.tsx`：新增 `mosaicRef` 与预烘焙函数，主循环中在字符 pass 前插入 mosaic pass，disc 内字符 pass 跳过。
- 移除/降权：现有 `HIGHLIGHT_*` 相关的"disc 内字符替换成随机高亮字符 + 白色渲染"逻辑，在 disc 内不再执行（disc 外行为不动）。
