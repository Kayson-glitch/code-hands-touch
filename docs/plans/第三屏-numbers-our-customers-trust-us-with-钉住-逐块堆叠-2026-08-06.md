# 第三屏：Numbers Our Customers Trust Us With（钉住 + 逐块堆叠）

在第二屏（黑底 slogan）之后新增第三屏。UI 参数 1:1 取 Figma 节点（1440 画板），交互复刻 kore.ai 的「整段钉住、内容块随滚动一块块叠加出现，最后一块出现后释放页面滚动」。

## 交互（参考 kore.ai）

- 整段高度约 320vh，内部 `position: sticky; top: 0; height: 100dvh` 钉住一屏。
- 滚动进度 0→1 映射到 7 个内容块的依次出现，顺序：
  1. 标题「Numbers our customers trust us with.」
  2. 标题下的彩色渐变细线
  3. 卡片 1 → 4. 卡片 2 → 5. 卡片 3
  4. 大数字 +85% → 7. 大数字 13k → 8. 大数字 +90%
- 每块出现方式：opacity 0→1 + translateY 24px→0，约 520ms，`cubic-bezier(0.22,1,0.36,1)`，块之间有轻微重叠（后一块在前一块约 70% 时开始）。
- 已出现的块保持可见（堆叠而非替换）；向上回滚逐块反向消失，完全可逆。
- 最后一块出现后进度到 1，sticky 自然解除，页面继续向下滚动（不额外加滚动锁）。
- `prefers-reduced-motion` 时全部直接显示。

## UI 参数（按 Figma，1440 基准，容器 1200 居中）

- 背景 `#FAFAFA`，正常文档流，位于第二屏之后。
- 标题：Clash Display Medium 48px / 56px，capitalize，`#0E0B22`，两行，左对齐（左 120px）。
- 渐变细线：宽 460px、1px，`#137DFF → #FF18AA → #FFCD17`（与导航顶部同一渐变），位于卡片行上沿。
- 卡片行：3 张 400×540，1px `#E1E0E4` 描边，横向相接（左起 120 / 520 / 920）。
  - 卡内图片占位：352×380，`#D9D9D9`，距卡左/上 24px。
  - 标题：Montserrat SemiBold 16px / 24px，`#0E0B22`。
  - 正文：Montserrat Regular 14px / 24px，`#7A7885`，与标题间距 10px。
  - 文案沿用 Figma：Accuracy Improvement / Tickets resolved on first contact without human handoff.
- 大数字行：三组，左起 168 / 568 / 968。
  - 数字 Clash Display Medium 100px（单位 `%` / `k` 为 68px），纯黑。
  - 标签 Montserrat Medium 18px / 26px，`#0E0B22`，与数字间距 20px。
  - 内容：+85% / 13k / +90%，标签均为 Accuracy Improvement。
- 响应式：1200 容器改为 `min(100% - 48px, 1200px)`；<1200 时卡片行降为可横向等分的 1fr×3，<768 时单列堆叠、数字字号按比例缩小。图片先用灰色占位块。

## 主题联动

第三屏是浅色。沿用现有 `app-bg-change` 事件机制：滚出第二屏进入第三屏时广播回浅色，让导航栏与底部输入框恢复浅色样式；回滚到第二屏时恢复深色。不改动第一屏、第二屏既有动效与滚动逻辑。

## 技术说明

- 新增 `src/components/MetricsSection.tsx`：内部用 rAF + `getBoundingClientRect` 计算 sticky 进度（与 `SloganSection` 同一套写法），用 `smoothstep` 生成每块的 0→1 值；块定义为数组，便于调顺序与节奏。
- `src/routes/index.tsx`：在 `<SloganSection />` 之后渲染 `<MetricsSection />`。
- 主题广播：在 `MetricsSection` 的滚动回调里，按其顶部是否越过阈值派发 `app-bg-change`（浅色），第二屏原有派发逻辑不动。
- 颜色统一用 `src/styles.css` 里已有的 `--ink / --ink-muted / --hairline` 等 token，缺的（如 `#D9D9D9` 占位、渐变）补成 token 再引用。
- 不引入 Figma 的 `localhost:3845` 资源。

## 验证

Playwright 在 1280×900 与 1440×900 下逐步滚动第三屏，抓取 7 个阶段截图，确认块依次出现、回滚可逆、最后一块后页面正常继续滚动，且导航栏配色随之切回浅色。
