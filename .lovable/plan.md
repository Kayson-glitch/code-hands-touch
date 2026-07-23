
## 第二屏 — Slogan 区块

参考 redomedia.co 第二屏：满屏黑底 + 大号 serif slogan，滚动时文字按词从暗灰渐次高亮为亮白，下方跟一句小字副标题。

### 结构
- 新组件：`src/components/SloganSection.tsx`
- 在 `src/routes/index.tsx` 中，紧跟首屏（Hero 所在的 `min-h-screen` 容器）之后挂载 `<SloganSection />`，形成第二个 `100vh` 段落
- 主标题：`Imagine a space between vision & impact`（两行，居中）
- 副标题：`That's where we thrive.`（小字、更暗）
- 字体：沿用已加载的 Instrument/Cormorant 风格 serif（复用现有 `font-display` 或直接内联 `Clash Display`/`serif` fallback；确认无需新增字体，若需要则加一个 Google Fonts serif link 到 `__root.tsx`）

### 交互（滚动驱动的逐词高亮）
- 拆词渲染：每个词 `<span>`，默认 `color: rgba(255,255,255,0.18)`
- 使用 `IntersectionObserver` + `scroll` 监听区块自身在视口中的进度 `p ∈ [0,1]`：
  - 进入视口开始（section top 到达 viewport 底 80%）→ `p=0`
  - 区块中心到达视口中心 → `p≈1`
- 每个词分配一个阈值 `t_i = i / (N-1)`，实际亮度 = `smoothstep(t_i - 0.15, t_i + 0.05, p)`，插值 rgba(255,255,255,0.18) → rgba(245,240,230,1)
- 副标题作为最后一个"词"参与相同曲线，稍晚亮起
- 使用 `requestAnimationFrame` 节流，spans 用 CSS variable `--lit` 驱动 `color`，避免 React 每帧 re-render

### 视觉细节
- 背景 `#000`，与首屏、`GlitchGrainOverlay` 扫描线保持一致（overlay 已全局覆盖，不需重复）
- 主标题：约 clamp(40px, 5.2vw, 76px)，`line-height: 1.15`，letter-spacing `-0.01em`
- 副标题：约 16–18px，`opacity` 由动画驱动，颜色暖白 `#EDE7DA`
- 居中：`flex items-center justify-center min-h-screen`
- 无位移动画，只做颜色/透明度过渡，避免破坏首屏视频滚动手感

### 不做的事
- 不改动首屏视频、扩散、导航、ScrollHint 等已有逻辑
- 不引入新的滚动库（GSAP/Lenis），使用原生 scroll + rAF
- 不加入图片/hands 装饰（用户只要 slogan 内容和交互）

### 技术要点
- `SloganSection` 内部持有 `sectionRef`，`useEffect` 内注册 `scroll` 监听
- 每帧计算 `p` 后写入根元素 `style.setProperty('--p', p)`；各词 `style={{ '--t': ti }}`，通过 CSS `color-mix` 或计算好的 `--lit`（在 rAF 中直接 set 每个 span 的 `--lit`）实现
- 采用后者（rAF 里循环 set spans 的 `--lit`）更精确、无需 CSS `color-mix` 兼容顾虑

### 文件改动
- 新增 `src/components/SloganSection.tsx`
- 修改 `src/routes/index.tsx`：在 Hero 容器闭合后追加 `<SloganSection />`
