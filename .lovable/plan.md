## 目标
参考源站 good-fella.com，让悬停揭示效果：
1. 鼠标移入时有轻微延时才开始出现（源站有一个 ~120ms 的"预热"延时）
2. 揭示区域内不再拉高字符密度，保持原有的明暗关系（源站只 scramble 字符 + 上色，不会把暗部提亮成亮部）

## 改动位置
仅编辑 `src/components/AsciiHandsFooter.tsx`，参数与一小段绘制逻辑。

### 1. 移入延时（ease-in delay）
在文件顶部常量区新增：
```ts
const INTENSITY_IN_DELAY_MS = 120; // 移入后延迟才开始上升，移出立即回落
```
在 draw 循环里，`target = m.active && !prefersReduce ? 1 : 0` 后面维护一个 `hoverDwellMs`：
- 当 `m.active` 时 `hoverDwellMs += dt`；不活动时归零。
- 只有 `hoverDwellMs >= INTENSITY_IN_DELAY_MS` 时，intensity 才向 1 缓动；否则保持当前值（≈0）。
- 移出（target=0）路径不变，立刻淡出。

效果：光标进入后约 0.12s 才开始出现揭示盘，符合源站的轻微延时手感。

### 2. 揭示不影响明暗关系
当前逻辑：
```ts
const lifted = c.idx + sharp * (RAMP_LEN - 1 - c.idx) * 0.85;
```
把暗部字符（低 ramp index）强行推向亮部，导致手掌暗面被"提亮"。

改为保留原始密度，仅做 scramble：
```ts
// 不再 lift 密度，保留原明暗；仅在同亮度附近做小幅 scramble
const scrambleOffset = Math.floor(
  (scramble - 0.5) * RAMP_LEN * 0.25 * sharp,
);
const finalIdx =
  (c.idx + scrambleOffset + RAMP_LEN) % RAMP_LEN;
```
颜色 tint 逻辑（`r/g/bl` 向 `HR/HG/HB` 混合）保持不变——这样揭示盘内仍呈现暖白 ASCII 字符，但字符字形的疏密仍由原亮度决定，暗部仍是暗的字符（点、逗号等），亮部仍是密字符，明暗结构不被破坏。

## 不改动
- `GOOEY_RADIUS_UV / SOFTNESS / NOISE`（68px 尺寸保留）
- `INTENSITY_IN_MS / OUT_MS`（缓动时长不变）
- 视差、颜色 ramp、字体、网格等其它逻辑

## 验证
- `bun run build` 通过
- Playwright 截图：光标刚进入的 100ms 内基本无变化；~150ms 后揭示盘开始出现；揭示盘内暗部手掌区域字符不再被提亮为密字符。
