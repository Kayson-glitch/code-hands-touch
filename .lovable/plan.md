## 第三屏 - Metrics Section

### 结构与层级
- 新建 `src/components/MetricsSection.tsx`
- 在 `src/routes/index.tsx` 中紧跟 `SloganSection` 之后挂载
- 背景：浅色 `#F4F1EA`（暖米色，与整体黑/紫极光形成呼吸对比，避免纯白刺眼）
- 高度：`min-height: 100vh`，与前两屏节奏保持一致
- 需要覆盖住 fixed 的第一屏 → `position: relative; z-index: 10`
- 顶部保留 `GlitchGrainOverlay`（低强度，混合模式适配浅底），维持整体故障风统一

### 布局（横向三等分）
- 外层：`max-width: 1280px`，居中，左右 `6vw` padding
- 顶部：小标签 `INDICATORS / 指标` + 分段主标题（Clash Display）
- 三列 grid（desktop `grid-cols-3`，tablet `grid-cols-1`）：
  - 列之间用 `1px` 竖向渐变分隔线（透明→黑10%→透明）
  - 每列结构：
    - 序号 `01 / 02 / 03`（Geist Mono，小号，opacity 40%）
    - 大数字（Clash Display，`clamp(72px, 9vw, 132px)`，字重 500）
    - 小标题（Montserrat 600，16px）
    - 注释文案（Montserrat 400，13px，opacity 60%，2-3 行）

### 数据（占位随机文案）
1. `85%+` — Resolution Rate — Tickets resolved on first contact without human handoff
2. `12K` — Conversations / Day — Handled across 30+ languages in real time
3. `92%+` — CSAT Score — Measured across enterprise deployments in 2025

### 动画方案（Count-up 数字滚动）
- 使用 IntersectionObserver 触发（threshold 0.35）
- 触发后：
  - 数字：`requestAnimationFrame` 从 0 滚到目标值，1400ms，`easeOutExpo` 缓动；保留 `%` / `K` / `+` 后缀
  - 标签/注释：模糊淡入 `blur(8px)→0`，`translateY(12px)→0`，600ms，按列 stagger 120ms
  - 分隔线：`scaleY(0)→1`，`transform-origin: top`，700ms
  - 顶部标题走一次 `BlurText`（复用已有组件）
- 只触发一次，反滚不重置

### 与整体风格保持一致
- 字体：主数字/标题 Clash Display；正文 Montserrat；序号 Geist Mono
- 颜色 tokens：新增 `--metrics-bg / --metrics-fg / --metrics-muted / --metrics-rule` 至 `src/styles.css`
- 保留全屏 `GlitchGrainOverlay`（在此区域降低不透明度到浅底可见的程度）
- 无第三方依赖，纯 React + CSS

### 变更文件
- 新增 `src/components/MetricsSection.tsx`
- 修改 `src/routes/index.tsx`（在 `<SloganSection />` 后追加 `<MetricsSection />`）
- 修改 `src/styles.css`（新增 4 个 CSS token）