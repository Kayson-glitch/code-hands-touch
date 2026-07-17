## Goal

在多分辨率 / DPR 下确认 `AsciiHandsFooter` 里 Geist Mono 的字号、字距、行高与源站 goodfellastudio.com 页脚逐像素对齐，找出偏差并修复。

## 1. 采集源站真值（多视口 + DPR）

用 Playwright（沙箱内已装）打开 `https://goodfellastudio.com/`，滚动到底部页脚 ASCII 区，在以下矩阵采样：

| 视口 CSS px | DPR |
|-------------|-----|
| 390 × 844   | 2   |
| 768 × 1024  | 2   |
| 1280 × 800  | 1   |
| 1280 × 800  | 2   |
| 1920 × 1080 | 1   |

在每个视口执行：
1. `getComputedStyle` 页脚 ASCII 容器，读取 `font-family / font-size / line-height / letter-spacing / font-weight`。
2. 通过在页面里插入一个 `<span>ABCDEFGHIJ</span>` 用同款字体测量 `getBoundingClientRect().width / 10` → 单字宽（advance width）。同一 span 的 height → 行高。
3. 元素级截图（`page.locator(...).screenshot`）保存到 `/tmp/browser/gfs/<viewport>.png`，供人工对照。
4. 记录字符栅格：找两行相邻 glyph，取其 y 差 = 行高像素；同一行相邻 glyph x 差 = 字宽像素。

把 5 组读数写入 `/tmp/browser/gfs/measurements.json`。

## 2. 采集本地真值

对 `http://localhost:8080/` 同样五个视口重复步骤 1–4，输出 `/tmp/browser/local/measurements.json`。除 `getComputedStyle` 外，额外读 canvas 里的字号：从 `AsciiHandsFooter` 常量 `FONT_PX / CELL_W / CELL_H` 反推，并用 `ctx.measureText("M")` 的 `width` 实测 Geist Mono 在当前 DPR 下的 advance。

## 3. 比对与判定

生成 diff 表格，字段：source vs local 的 `font-size / line-height / advance / cell_w / cell_h`。判定容差 ≤ 1 CSS px 为合格。特别关注：

- **DPR=2 高清屏**：canvas 的 `setTransform(dpr,...)` 已生效，但 `ctx.font` 是 CSS px；确认 `measureText` 结果与源站 span 宽度一致。
- **Geist Mono 未加载时的 fallback**：源站与本地是否落到同一 fallback（`ui-monospace`）。用 `document.fonts.check('11px "Geist Mono"')` 断言。
- **canvas letterSpacing**：Chromium 支持；Safari/Firefox 若返回 undefined 需要手动步进 x。

## 4. 修复策略（只在检测到偏差时执行）

只改 `src/components/AsciiHandsFooter.tsx`（无布局或后端改动）：

1. **advance 不匹配** → 调整 `CELL_W`（整数 6/7/8）或改成浮点步进 `x = Math.round(i * advance)`，其中 `advance = ctx.measureText("M").width`。用实测代替硬编码 7。
2. **行高不匹配** → 调整 `CELL_H`（10/11/12）或改用 `lineHeight = Math.round(FONT_PX * 1.1)`。
3. **字号不匹配** → 若源站 DPR=1 下测得 12px，把 `FONT_PX` 调到 12，同步 `CELL_H`。
4. **DPR 缩放偏差** → 若发现在 DPR=2 下 canvas 字符“肥”一像素，说明 `setTransform` 之后又乘了 dpr，一次；确认无重复缩放。
5. **字体未加载导致 fallback 抖动** → 在 draw 循环之前 `await document.fonts.load('500 11px "Geist Mono"')`，加载完再 `resample + draw`。

修复后重跑第 2 步验证，直到所有视口 diff ≤ 1 px。

## 5. 交付物

- 更新后的 `AsciiHandsFooter.tsx`；
- 一次 `bun run build` 通过；
- 简短汇报：五个视口下 source 与 local 的 measurements 表 + 结论。

## 技术细节

- 用 `playwright.async_api` + `chromium.launch(headless=True)`；每个视口用 `context = browser.new_context(viewport=..., device_scale_factor=dpr)`。
- 元素截图，不要 `full_page=True`。
- 脚本、JSON、截图统一放 `/tmp/browser/`，不污染仓库。
- 不引入新依赖；不动路由 / 图片 / 布局 / wordmark 文案。
