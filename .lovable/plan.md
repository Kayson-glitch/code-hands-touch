## 目标修正

- 标题组（标题 + 副标题 + 按钮）与手部作为一个整体，垂直居中于首屏视口。
- 底部 Synergy.AI 大字保持吸底，不参与这个居中组。

## 当前状态

- `HeroCopy.tsx`：`absolute top-0 paddingTop:22vh`，从顶部按 vh 计算。
- `AsciiHandsFooter.tsx` canvas：`absolute bottom-0 height:62vh`，从底部起算。
- 两者各自贴边定位，无法作为整体居中。

## 改动方案

把标题组和手部包在同一个"居中组"里。做法是让二者仍然定位在容器内，但用同一个几何锚点计算位置，使"标题顶 ↔ 手指尖"这段视觉高度作为一个块整体居中：

### `AsciiHandsFooter.tsx`
- canvas 从 `bottom-0` 改为绝对定位到"垂直居中偏下"：`top: 50%`, `height: 55vh`, `transform: translateY(-2vh)`。这样手部整体位于视口中线略偏下，为上方标题留位。（数值：手顶约 20vh，手底约 75vh。）
- 底部 Synergy.AI 大字块继续 `bottom-0`，保持吸底不变（本次不改字体/尺寸，仅确认位置）。

### `HeroCopy.tsx`
- 标题组改为紧贴手部上沿：`absolute inset-x-0`，用 `top: 50%` + `transform: translateY(calc(-50% - 28vh))` 把标题组的中心锚到手部上方。视觉上标题底部 ≈ 手部上沿（≈20vh 处），二者作为一个整体上下居中于视口。
- 保留 `flex flex-col items-center text-center` 与现有内间距。

## 校验

- 三段内容视觉分布：
  - 标题组：约 8vh–22vh
  - 手部：约 22vh–75vh
  - 底部 Synergy.AI 大字：吸底 100vh
- 上方留白 ≈ 8vh，下方（手底到 wordmark 顶）≈ 15vh，标题+手作为整体大致居中。

## 不改动

- 手部 canvas 内部逻辑、intro 视频、SiteNav、FinChatDock、底部 wordmark 样式。

## 交付

- 修改 `src/components/AsciiHandsFooter.tsx`（canvas 定位/尺寸）
- 修改 `src/components/HeroCopy.tsx`（定位方式）
