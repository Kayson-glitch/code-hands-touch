# 第三屏卡片区细节修正

## 1. 标题与卡片区的间距（蓝色部分）
标题模块上下留白偏紧，卡片顶边几乎贴着 "for enterprise AI"。加大标题区块的上下内距，使标题与下方卡片行之间有明显呼吸空间（上方约 40px、下方约 56px 的量级，随视口平滑缩放）。

## 2. 卡片行顶部的渐变进度条（绿色部分）
参考站在三列卡片顶部有一根随滚动增长的横线。这里做同样的机制，但颜色统一为项目自有的品牌渐变（与导航栏顶部同一组：#137DFF → #FF18AA → #FFCD17）：

- 位置：卡片区顶边，横跨整个卡片容器宽度，厚度 2px。
- 行为：宽度由第三屏的滚动进度驱动，从 0% 线性增长到 100%；回滚时反向缩短。
- 底部保留一条 1px 极浅底轨，未填充部分不会是空白突变。
- 移动端与 prefers-reduced-motion：直接显示 100%，不做增长动画。

## 3. 灰色边框完整且粗细一致（红框部分）
现在每张卡片各带一圈 1px 边框，导致两处相邻竖线叠成 2px，且列在动画位移时边框被裁切、看起来断开。改为：

- 灰色描边从"每张卡片各画一圈"改为"卡片容器画一圈外框"，外框始终完整，不随列位移被裁掉。
- 列与列之间只画单侧竖线（第 2、3 列各一条左边线），保证中间分隔线与外框同为 1px，视觉粗细一致。
- 颜色继续用现有的 `--hairline`。

其余布局、文字、数字动画与结尾停留逻辑不变。

## 技术细节
- `src/styles.css`
  - `.kore-outcomes__header` 增加 `padding-block`。
  - `.kore-outcomes__card` 去掉 `border`；给 `.kore-outcomes__cards` 容器加 `border: 1px solid var(--hairline)`，`.kore-outcomes__item:not(:first-child)` 加 `border-left: 1px solid var(--hairline)`。因外框需要不被列位移裁切，把边框移到 `.kore-outcomes__cards-container` 的内层包裹元素上并保留 `overflow: hidden` 于内层网格。
  - 新增 `.kore-outcomes__progress` / `__progress-fill`，fill 使用 `linear-gradient(90deg, #137DFF, #FF18AA, #FFCD17)`，`transform: scaleX(var(--p))` + `transform-origin: left`。
- `src/components/MetricsSection.tsx`
  - 在卡片容器顶部渲染进度条元素，`--p` 绑定已有的 `progress` state（`reducedMotion`/移动端时取 1）。

## 验证
浏览器在多个滚动位置截图，确认：标题与卡片间距变大、外框四边完整无断裂、中间竖线与外框同为 1px、进度条随滚动增长且可回退，控制台无报错。
