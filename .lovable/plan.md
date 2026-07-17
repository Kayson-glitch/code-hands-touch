## Goal

对齐源站（goodfellastudio.com 页脚）的 ASCII 手部效果：字体切到 **Geist Mono**，字距/行高与源站逐项一致，并恢复源站那种高对比、有厚度的明暗过渡。

## 1. 引入 Geist Mono（与源站一致）

源站字体：`Geist Mono`（Vercel 出品，等宽），fallback 到 `ui-monospace, monospace`。

- 在 `src/routes/__root.tsx` 的 `head().links` 中加入 Google Fonts 预连接 + Geist Mono 样式表（权重 400/500）。不要在 `styles.css` 里 `@import` URL（Lightning CSS 不支持）。
  ```
  https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap
  ```
- `AsciiHandsFooter.tsx` 中把 canvas 字体串改为
  `'Geist Mono', ui-monospace, "JetBrains Mono", Menlo, monospace`。
- 中央版权 copy 与底部 wordmark 一并统一到 Geist Mono（源站 wordmark 也是同一族的加粗变体），去掉现有的 Inter fallback。

## 2. 字距 / 行高 / 单元格像素对齐

源站截图测量（等宽栅格）：字号 ≈ 11px，行高 ≈ 12px，字距紧凑无额外 tracking；每个字符盒近似 `6.6 × 12`（宽:高 ≈ 0.55）。

我们的实现：改成
- `CELL_W = 7`（保留）→ 精确为 `6.6`，用 `Math.round` 布局但绘制时按 `6.6` 步进；或者把 `CELL_W=7, CELL_H=12`，字号 `11px`，`ctx.textBaseline="alphabetic"`，Y 偏移 `+10`。选后者，简单且贴合。
- 新增常量 `FONT_PX = 11`, `CELL_W = 7`, `CELL_H = 12`。
- `ctx.font = '500 11px "Geist Mono", ui-monospace, monospace'`。
- 关闭 canvas 的字距自适应：设置 `ctx.textAlign = "left"`，`ctx.letterSpacing = "0px"`（新 API，支持则用）。
- 绘制坐标：`fillText(ch, x, y + 10)`（baseline 校正）。

对应地，`sampleImage` 里 cols/rows 用新的 CELL_W/CELL_H；`resample` 无需其它改动。

## 3. 还原明暗对比（chiaroscuro）

当前 gamma=0.85 把中间调抬得过亮，coral 全域偏红，导致「洗白」。源站呈现的是**接近纯黑 → 冷灰 → 象牙白**的高对比灰阶，肩部/指缝几乎全黑，指关节高光近白。

改动（都在 `AsciiHandsFooter.tsx`）：

1. **拉高对比**：百分位窗口收紧到 5%..99%；gamma 提高到 `1.15`（>1 压低中间调，加深阴影）。visibility 阈值恢复到 `0.06`，避免噪点边缘出现浮字。
2. **颜色改回单色暖白**（源站不是 coral，是暖白/象牙）：
   - shadow `rgb(40,32,28)` → highlight `rgb(240,232,220)`，按 `bb` 线性插值。
   - alpha：`0.35 + bb*0.65`（暗处半透，让黑背景吃进去，形成体积感）。
3. **Ramp 更贴 Geist Mono 的实际字面**：使用 11 步经典密度串
   `" .\`':,-~=+*xoevmwqbdOZ0M8W#N@"`（每字符实测在 Geist Mono 下面积覆盖单调递增），代替当前 50 字符含 `|/\\` 等竖笔画的串（那些在等宽下面积不单调，破坏梯度）。
4. **光标交互**：push 幅度回到 `t*6`；lift 只加白，不加饱和度（RGB 各 +`t*140`）；ramp bump 保持 `+floor(t*5)`。

## 4. 验证

- `bun run build` 通过。
- Playwright 打开 `http://localhost:8080/`，viewport 1280×1800，截 2 张图：无光标、光标悬停在右下（Adam 手）。人工比对：
  - 手掌深处应几乎无字（黑）；
  - 指关节应密集亮字（`@#8`）；
  - 中间调呈可见的 `xoev` 灰阶带；
  - 字体明显是 Geist Mono（`0` 带斜杠、`@` 圆润）。

## 技术细节

- **只改文件**：`src/routes/__root.tsx`（加字体 link）、`src/components/AsciiHandsFooter.tsx`（字体、栅格、色彩、ramp、gamma）。
- **不改**：图片资源、布局、wordmark 文本、路由、后端。
- **无新依赖**（用 Google Fonts CDN，符合项目 tailwind4 远程字体规范）。
