# 第三屏滚动手感 1:1 对齐源网站

目标：让「What Artemis changes」模块的滚动感受与 kore.ai 一致 —— 整页带惯性、行程标定正确、揭示动画有缓动曲线。只改滚动与动画参数，不动 UI 内容与配色。

## 1. 整页惯性平滑滚动

源站用 Lenis 式平滑滚动：滚轮停止后画面仍会缓慢滑行，所有 sticky 动画因此显得"顺滑跟手"。

- 引入 Lenis（`lenis`，轻量、无副作用），在根路由挂载一次。
- 参数对齐源站量级：`lerp ≈ 0.1`、`wheelMultiplier = 1`、`smoothWheel = true`、触摸设备不启用平滑。
- 尊重 `prefers-reduced-motion`：开启时完全不启用 Lenis。

### 与第一屏滚轮劫持的兼容（关键）

第一屏手部动画（HalftoneHandsFooter）自己接管 `wheel` 并做 `snapTo`。做法：

- 手部动画处于劫持阶段时调用 `lenis.stop()`，交还页面滚动时 `lenis.start()`。
- 第一屏的 `snapTo` 改为走 `lenis.scrollTo(target, { duration })`，避免两套动画各自 `scrollTo` 打架。
- Lenis 用 rAF 驱动，MetricsSection 的进度计算改为在同一 rAF 中读取（订阅 Lenis 的 scroll 事件），消除掉一帧延迟造成的"发涩"。

## 2. 行程标定

保持源站映射公式 `p = (vh - top - vh*0.25) / (height - vh*0.8)`，但校正轨道高度：源站轨道 = 卡片高度 × 列数，且 sticky 顶部留白与我们的 69px 导航一致。核对实测滚动像素数与源站在 1440×900 下一致，必要时微调轨道倍数。

## 3. 揭示动画缓动

- 每列进度 `p*3 - index` 之后套入缓动（`easeOutCubic` 量级），替换当前的线性位移。
- 透明度按列进度前 1/3 渐显，保留但改为同一缓动，避免"跳变"。
- 顶部 3px 渐变进度条保持线性跟随原始进度（源站即为线性），继续与导航栏渐变同速。

## 4. 验证

用 Playwright 在 1440×900 与 1280×800 下分段截图（p=0/0.33/0.66/1），确认：三列依次浮现、无重叠、footer 不被压、进度条与列同步、第一屏交接无跳动。

## 技术备注

- 新增依赖：`lenis`。
- 改动文件：根路由（挂载 Lenis + 提供上下文）、`src/components/HalftoneHandsFooter.tsx`（stop/start 与 scrollTo 接管）、`src/components/MetricsSection.tsx`（订阅 Lenis、缓动）、`src/styles.css`（仅在需要时调 sticky 偏移）。
