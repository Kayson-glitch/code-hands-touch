## 目标

在不改变布局、动效、交互、颜色、字体等任何其他元素的前提下，略微增强手部 ASCII 字符的明暗过渡，使其看起来更具立体层次。

## 当前实现

`src/components/AsciiHandsFooter.tsx` 的 `sampleImage` 函数中，源图亮度经过以下步骤映射到字符密度：
1. 百分位拉伸：`lo = 5th percentile`，`hi = 99th percentile` → 归一化到 0..1。
2. Gamma 校正：`gamma = 0.92`，将中间调提亮。
3. 边缘羽化：`feather = pow(alpha, 0.65)`，让半透明边缘向低密度字符溶解。
4. 映射到字符 ramp：`b` → ramp index。

## 修改方案

仅调整亮度映射曲线，使亮部更亮、暗部更暗，从而增大明暗反差：
1. 将 gamma 从 `0.92` 略微降至 `0.86`，增强中间调向两端的分离。
2. 在 gamma 之后增加一个非常轻微的 S 曲线（smoothstep）:
   ```
   b = smoothstep(b) = b * b * (3 - 2 * b)
   ```
   这会在不改变 0 和 1 端点的情况下，压暗暗部、提亮亮部，让手部起伏更立体。
3. 保持 `lo`/`hi` 百分位、羽化、字符 ramp、cell size、hover/click 交互逻辑等完全不变。

## 涉及文件

- `src/components/AsciiHandsFooter.tsx`：修改 `sampleImage` 内的亮度映射公式。

## 验证方式

- 类型检查通过。
- 在预览中滚动到手部显示阶段，观察手掌、手指、手臂的亮面与暗面字符密度差异是否比当前更明显，同时确认字符整体仍保持可读、不出现过曝或死黑。