## Goal

在源站 canvas 上直接测量字符栅格的**真实像素间距**，然后把本地 `AsciiHandsFooter.tsx` 的 `FONT_PX / CELL_W / CELL_H` 逐项对齐。上一轮只用一行数据估算，误差偏大——这一轮做多行多列采样并取模态值。

## 1. 精确测量源站栅格

Playwright 打开 `https://good-fella.com/`，1280×800@2，滚到 ASCII 页脚，截取 canvas 元素本体（`await canvas.screenshot()`，非页面视口），得到 960×1050 device-px 的干净底图。

在 Python 里对底图分析：

1. 生成 coral 掩膜 `R > G+8 且 R > 40`。
2. 找 top-20 行/列（coral 像素最多的），逐行连通域取字符中心 x，逐列连通域取字符中心 y。
3. 对每一组中心序列求相邻差，跨所有行/列汇总模态值 → **真 CELL_W / CELL_H（device px）**，除以 DPR（960/640 = 1.5）→ CSS px。
4. 同时对每个字符连通域测量宽高与像素密度，估算实际 **字号**：`glyph_height / cap-height ratio` 反推 font-px。
5. 输出 JSON：`{cellW_css, cellH_css, fontPx, glyph_avg_w, glyph_avg_h}`。

## 2. 对本地做同样测量

`http://localhost:8080/`，1280×800@2，直接对 `AsciiHandsFooter` 的 canvas 元素 `.screenshot()`。同样的 coral 掩膜（本地 coral 色相略不同，但 `R>G+8` 依旧成立）+ 同样的连通域测法 → 输出同一份 JSON。

## 3. 计算 diff 并调参

以源站为基准，如果任何一项差 ≥1 CSS px，就在 `AsciiHandsFooter.tsx` 里直接改常量：

| 参数 | 位置 |
|------|------|
| `FONT_PX` | 顶部常量 |
| `CELL_W` | 顶部常量 |
| `CELL_H` | 顶部常量 |
| baseline 偏移（`+FONT_PX - 1`） | draw 循环末尾 |

如果字号需要动，同步更新 baseline 偏移让字符垂直居中于 cell。字距（`letterSpacing`）保持 0——源站没有自定义字距，字距完全靠 CELL_W 步进。

## 4. 验证

- `bun run build` / `tsgo` 无错。
- 再次跑第 1 步的测量脚本对比本地和源站，确认三个参数都在 ±1 CSS px 内。
- 截一张 1280×800@2 的本地 canvas 图 `/tmp/browser/loc_after.png`，与 `/tmp/browser/source_footer.png` 目视对比：手部密度、字符气隙、行间空隙一致。

## 出范围

不改颜色、字体族、字符 ramp、光标交互、布局。这些上一轮已验证与源站对齐；本轮只调像素栅格。

## 技术细节

- 只改 `src/components/AsciiHandsFooter.tsx`。
- 脚本、JSON、截图放 `/tmp/browser/`。
- 无新依赖。
