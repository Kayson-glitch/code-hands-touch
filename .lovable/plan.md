## 第二屏 Slogan Section

在首屏（`AsciiHandsFooter` + `HeroCopy` + `FinChatDock`）之后新增独立的 `SloganSection`，仅新增内容，不动现有任何组件、动画与交互。

### 视觉参考
- 参考站 `redomedia.co`：整屏黑底，居中一段大号 serif 文案；随滚动逐词由暗（灰）变亮（近白），已滚过的词保持高亮，未到的词保持低亮。
- 上传图对应中间状态：`while we shape how the world sees it.` 中 `world sees it.` 仍是暗灰、其余已点亮。

### 内容
文案（英文，贴合 Synergy.AI 语境）：
> We craft intelligent support experiences that keep pace with your ambition.  
> So your team can focus on what matters, while we shape how the world hears you.

（如需换文案我可以在实现前一次替换；不影响结构）

### 结构
- 新文件 `src/components/SloganSection.tsx`
  - 一个 `section`，`min-h-screen`，纯黑背景 `#000`，居中布局。
  - 文本用 `font-display`（Clash Display）**不**改成 serif —— 参考站是 serif，但为了与首屏保持字体统一我默认沿用 Clash Display。如果你想要 serif（Instrument Serif / Cormorant），我在实现前替换。
  - 字号响应式：`clamp(28px, 4.2vw, 60px)`，`line-height: 1.25`，`letter-spacing: -0.01em`，`max-width: 1100px`，`text-align: center`。
- 在 `src/routes/index.tsx` 的 `videoSrc !== null` 分支内、`FinChatDock` 之前追加 `<SloganSection />`。首屏容器不再是 `fixed`/`absolute` 定位的整屏（AsciiHandsFooter 等本身为绝对定位覆盖首屏），slogan 作为下一个 `min-h-screen` 块自然承接滚动。

### 交互（滚动逐词点亮）
- 将文案按空格 split 成 word tokens，每个 token 用 `<span>` 包裹。
- 用 `IntersectionObserver`（`threshold: 0` + `rootMargin`）+ `scroll` 监听 section 在视口中的进度 `p ∈ [0,1]`：
  - `p = clamp((viewportCenter - sectionTop) / (sectionHeight - viewportHeight*0.6), 0, 1)`
- 每个词分配区间 `i/N ~ (i+1)/N`，用 `smoothstep` 计算该词亮度 `a`：
  - 未到：`opacity: 0.22`（暗灰）
  - 过渡：`0.22 → 1`，同时轻微 `filter: blur(2px) → blur(0)` + `letter-spacing` 收紧 1px
  - 已过：保持 `opacity: 1`
- 用 `requestAnimationFrame` 节流，仅在 section 进入视口时激活监听，离开即断开，避免影响首屏性能。
- 尊重 `prefers-reduced-motion`：全部词直接 `opacity: 1`，无过渡。

### 不改动
- `AsciiHandsFooter` / `IntroVideo` / `IntroPreloader` / `SiteNav`（含深浅反相与显隐时序）/ `HeroCopy` / `FinChatDock` / `GlitchGrainOverlay` / `ScrollHint` / `useHeroLayout` / `styles.css` 现有规则均不变动。
- 不调整首屏 z-index、滚动映射、burn 动画。

### 需要你确认
1. **字体**：沿用 Clash Display 保持品牌统一，还是切换成 serif（更贴近参考站）？
2. **文案**：用上面这段英文默认版，还是你直接给一段中文/英文替换？

如无异议，我按上述默认（Clash Display + 上面英文文案）实现。
