## Goal

不再靠肉眼推断——直接从 good-fella.com 的 canvas 拦截真值：字体串、字号、字符集、颜色梯度、明暗曲线。然后把这些参数原样搬到 `AsciiHandsFooter.tsx`。

## 1. 拦截源站 canvas 绘制真值

用 Playwright 打开 `https://good-fella.com/`，在文档加载**之前**通过 `add_init_script` 钩住 `CanvasRenderingContext2D.prototype` 的 setters/methods：

```js
const rec = (window.__gfsRec = { font: new Set(), fillStyle: new Set(), glyphs: {}, xs: new Set(), ys: new Set(), positions: [] });
const proto = CanvasRenderingContext2D.prototype;
const _font = Object.getOwnPropertyDescriptor(proto, 'font');
Object.defineProperty(proto, 'font', {
  set(v){ rec.font.add(v); _font.set.call(this, v); },
  get(){ return _font.get.call(this); }
});
const _fs = Object.getOwnPropertyDescriptor(proto, 'fillStyle');
Object.defineProperty(proto, 'fillStyle', {
  set(v){ if (typeof v === 'string') rec.fillStyle.add(v); _fs.set.call(this, v); },
  get(){ return _fs.get.call(this); }
});
const _ft = proto.fillText;
proto.fillText = function(t, x, y){
  rec.glyphs[t] = (rec.glyphs[t]||0)+1;
  rec.xs.add(Math.round(x)); rec.ys.add(Math.round(y));
  if (rec.positions.length < 400) rec.positions.push([t, x, y, this.fillStyle]);
  return _ft.apply(this, arguments);
};
```

滚到 ASCII 页脚并停留 3–5 秒采样，然后回传：

- `Array.from(rec.font)` → 完整字体串（含 weight、字号、family）
- `Array.from(rec.fillStyle)` → 所有出现过的颜色（去重）
- `rec.glyphs` → 字符 → 出现次数（即字符集与相对频率）
- `sorted xs / ys` 求相邻差 → 单元格 `CELL_W / CELL_H`
- `rec.positions` 前 400 条 → 字符 × 颜色的相关性（明→暗字符对应哪种颜色）

采样在 1280×800@2 视口即可（我们已确认 Geist Mono metrics 与 DPR 无关）。输出到 `/tmp/browser/gfs_probe.json`。

## 2. 从颜色集反推明暗曲线

`fillStyle` 集合会是几十到上百个 `rgba(...)`。用 Python 计算每个颜色的相对亮度 `Y = 0.2126R + 0.7152G + 0.0722B`，排序后画曲线：

- **端点**：取最暗色 → 最亮色，作为我们代码里 shadow / highlight 的两端 RGB。
- **中段形态**：如果颜色沿 Y 单调、饱和度接近 0，就是灰阶；如果有偏色，就沿 R/G/B 各自拟合。
- **透明度**：若颜色都是 rgb 且没有 rgba(...,a<1)，说明源站 **alpha 恒为 1**——我们当前 `0.35 + bb*0.65` 是过度设计，应该改成常量。

## 3. 从 positions 求字符 ↔ 亮度映射

按 fillStyle 亮度 Y 分桶（10 桶），统计每桶最常出现的 top-5 字符 → 得到有序 ramp。这一定就是源站真实使用的字符串，替换我们代码里的手写 ramp。

## 4. 应用到 `AsciiHandsFooter.tsx`

- `FONT_PX`：从 `rec.font` 里解析（若源站用 12/13/14px，与我们的 11 不同则同步）。
- `CELL_W / CELL_H`：从 xs/ys 相邻差直接读出。
- `RAMP`：用第 3 步得到的实测字符串。
- 颜色两端与 gamma：用第 2 步得到的 shadow/highlight RGB；把 alpha 改成 1.0；重新拟合 gamma（若源站中间调偏亮就用 <1，偏暗就 >1）。
- 光标交互不动（源站无鼠标高亮，这是我们的增强）。

## 5. 验证

- `bun run build` 通过。
- Playwright 在 1280×800@2 分别截 source 与 local 页脚，输出 `/tmp/browser/side-by-side.png`（两图水平拼接）。人工比对：色相、密度、字符形状一致。

## 技术细节

- 只改 `src/components/AsciiHandsFooter.tsx`。
- 不改布局、图片、路由。
- 探针脚本、原始 JSON、拼接图放 `/tmp/browser/`，不入库。
- 无新依赖。
