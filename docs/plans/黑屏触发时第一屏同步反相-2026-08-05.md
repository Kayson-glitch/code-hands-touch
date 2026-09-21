# 黑屏触发时第一屏同步反相

## 目标

当第二屏越过 20% 阈值切成黑底时，固定在下层的第一屏（手部半调画面、Hero 文案、导航、底部输入条）同步反相为深色版本；回滚到阈值以上时全部还原浅色。切换与第二屏同一时刻、同一 300ms 过渡，读起来是整站一次性换肤。

## 反相后的配色规则

- 纸面：`#FAFAFA` → `#0A0A0A`（含 html/body 背景，避免边缘露白）。
- 手部半调点：现有由浅灰到中灰的墨阶整体翻转为由深灰到亮灰（在黑底上保持同样的“网屏”体感与相同的点面积逻辑，不改半调算法本身）。
- 文字：主文字 `#0E0B22` → `#FAFAFA`，次级/幽灵灰对应提亮；Hero 标题、副标题、导航文字、输入条占位文字一起走同一套 token。
- Hero「Book a Demo」按钮与导航按钮：深底白字 → 浅底深字，彩色流动渐变描边保持不变。
- 导航底部 1px 分隔线与滚动后的毛玻璃底色改用深色版本；顶部彩色渐变条保持不变。
- 底部输入条白色药丸 → 深色药丸，图标与占位文字提亮，阴影减淡。
- scroll 提示、幽灵手部仅在第一屏入场态出现（此时必为浅色），不需要额外处理。

## 交互与状态

- 主题开关来源仍是第二屏的阈值判断（`rect.top <= vh * 0.8` 进入，`> vh * 0.84` 退出），不新增滚动监听。
- 通过一个新的全局信号广播（不复用已有的 `app-bg-change`，那个事件目前承担入场显隐语义，复用会破坏 Hero 文案与输入条的出场逻辑）。
- 同时在 `<html>` 上打一个 data 属性，让 CSS token 层统一切换，减少组件里逐个改色。
- 尊重 `prefers-reduced-motion`：直接取最终颜色，无过渡。

## 技术要点

- `src/styles.css`：新增 `html[data-invert="1"]` 下的 token 覆盖（`--ink`、`--ink-muted`、`--ink-faint`、`--ink-ghost` 以及新增的纸面 token），并给 body/section 加 `background-color 300ms ease` 过渡。
- 新增 `src/hooks/useInvertTheme.ts`：暴露 `useInverted()` 订阅 `app-invert` 事件，供组件读取布尔值。
- `src/components/SloganSection.tsx`：在现有阈值判断里派发 `app-invert` 并写入 `document.documentElement.dataset.invert`。
- `src/components/HalftoneHandsFooter.tsx`：纸面色与 `INK_STOPS` 按反相状态取两套常量；html/body 背景色随之切换；canvas 重绘沿用现有 rAF 循环。
- `src/components/SiteNav.tsx`、`HeroCopy.tsx`、`FinChatDock.tsx`：把硬编码 hex 换成 token 或按 `useInverted()` 取值，仅动颜色，不动布局与尺寸。

## 验证

Playwright 在 1280×900 下滚动跨越阈值，抓阈值前后截图，确认第一屏与第二屏同时变黑、文字可读、回滚可还原。
