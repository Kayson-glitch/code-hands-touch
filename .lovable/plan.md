## 目标

1. 底部 "Synergy.AI" 大字改用 Montserrat 并真正吸附在视口底部（不再被 translateY 推出视口）。
2. 让"标题 + 副标题 + 按钮"与"手部"作为一个整体靠拢并整体居中，减少目前上下分散的感觉。

## 当前状态（已核对代码）

- `AsciiHandsFooter.tsx` L1270–1293：wordmark 容器 `bottom-0 height:45%`，内层 `transform: translateY(30%)` + `fontFamily: "Geist Mono"`，导致大字被推到视口下方看不到底边，字体也不是 Montserrat。
- `AsciiHandsFooter.tsx` L1295–1306：canvas `bottom-0 height:72vh`。
- `HeroCopy.tsx` L20–29：`absolute top-0 paddingTop:14vh`，标题在 ~14vh 位置；手掌大约位于 28vh–100vh 区间，中间空白过大。

## 改动

### 1. Synergy.AI 吸底 + Montserrat（AsciiHandsFooter.tsx）

- 外层容器：`bottom-0`、`height` 从 `45%` 降到 `28%`，去掉 `overflow-hidden` 造成的额外裁切（保留即可，只是不再需要靠它遮字）。
- 内层 `<span>`：
  - `fontFamily` 改为 `Montserrat, ui-sans-serif, system-ui, sans-serif`。
  - 删除 `transform: translateY(30%)`，改为 `alignSelf: flex-end` + 容器 `items-end`，保证文字基线贴着视口底部。
  - `fontSize` 保持 `clamp(8rem, 22vw, 22rem)`，`fontWeight` 改 700（Montserrat Bold，视觉与 Geist Mono bold 接近）。
  - 颜色维持 `rgba(255,255,255,0.05)`。

### 2. 标题与手部靠拢，整体居中（HeroCopy.tsx + AsciiHandsFooter.tsx）

思路：把"标题组 + 手部 + 底部 wordmark"视为一个垂直堆叠的整体，向视口中间收拢。

- `HeroCopy.tsx`：`paddingTop` 从 `14vh` 提到 `22vh`，让标题下移，紧贴手部上沿。
- `AsciiHandsFooter.tsx` canvas：`height` 从 `72vh` 降到 `62vh`，`bottom` 保持 0，让手部整体上抬留出的底部空间由 wordmark 填充；手部顶端约在 38vh 处，与标题（约 22vh 起、到 ~32vh 结束、按钮到 ~38vh）自然衔接。
- 结果：标题底部（≈38vh）几乎接手指尖（≈38vh），形成"标题—手—底部大字"三段紧凑居中构图。

## 不改动

- 手部 canvas 逻辑、hover/click/mosaic/流动/视差、intro 视频、SiteNav、FinChatDock 均保持原样。
- 配色与文字内容不变。

## 交付

- 修改 `src/components/AsciiHandsFooter.tsx`（wordmark 容器高度、字体、去 translateY；canvas 高度 72vh→62vh）
- 修改 `src/components/HeroCopy.tsx`（paddingTop 14vh→22vh）
