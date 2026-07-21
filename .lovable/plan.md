## 目标
在现有 ASCII 手部场景之上，叠加参考图（Synergy.AI）的首屏 UI：顶部导航栏 + 居中标题/副标题/CTA 按钮。全程不改动 IntroVideo、LiquidBurst 已删除、ASCII 手部动画等既有交互逻辑。

## 字体接入
在 `src/routes/__root.tsx` 的 `head().links` 中新增：
- Google Fonts: `Montserrat:wght@400;500;600`
- Fontshare: `Clash Display Variable`（`https://api.fontshare.com/v2/css?f[]=clash-display@500&display=swap`）

在 `src/styles.css` 顶部 `@theme` 前添加全局默认字体：
```css
body { font-family: 'Montserrat', system-ui, sans-serif; }
.font-display { font-family: 'Clash Display Variable', 'Clash Display', sans-serif; }
```

## 结构
新建两个组件，保持 `AsciiHandsFooter` 内部不动：
- `src/components/SiteNav.tsx` — 顶部导航栏
- `src/components/HeroCopy.tsx` — 居中标题区

在 `src/routes/index.tsx` 中用一个 relative 全屏容器包裹：
```
<div class="relative min-h-screen">
  <AsciiHandsFooter />           // z-0，现有场景
  <SiteNav />                    // fixed top-0，z-40
  <HeroCopy />                   // absolute 居中偏上，z-30，pointer-events-none（按钮除外）
</div>
```
所有 UI 层用 `pointer-events-none`，按钮/链接单独 `pointer-events-auto`，避免拦截 ASCII hover/click。

## SiteNav 规格
- 高度 68px，`fixed top-0 inset-x-0 z-40`
- 左侧 logo 区高度 28px：紫色圆形占位 + "Synergy.AI"（Montserrat 14/22 regular，可后续替换）
- 中部菜单：Platform ▾ / Solution ▾ / Pricing / Company Hub（14/22 regular）
- 右侧：Log In（文本按钮）+ Book a Demo（高度 32px 白底黑字圆角按钮）
- 自适应颜色：用 `IntersectionObserver` 或监听 `stage`（video / hands）来切换 `data-theme="light|dark"`
  - 视频阶段（浅色/未知背景）→ 文字黑、按钮白底黑字
  - 手部阶段（黑底 #0a0a0a）→ 文字白、按钮白底黑字保持
  - 实现方式：从 `AsciiHandsFooter` 暴露一个 `stage` 通过 URL-less 简单方案 — 用 `document.body` 的 `background-color` 采样 + `window` CustomEvent；或更简单：在 `AsciiHandsFooter` 已有 `document.body.style.background` 切换处，同步 `dispatchEvent(new CustomEvent('bg-change', {detail:'light'|'dark'}))`，SiteNav 监听。

## HeroCopy 规格
- 绝对定位居中（垂直约 30% 处）
- 主标题：`font-display`，48/56 medium
  - "Support that drives revenue,\npowered by **Synergy.AI**"（Synergy.AI 用紫→洋红渐变 `bg-clip-text`）
- 副标题：Montserrat 16/24 regular，muted 灰
  - "Intelligent Knowledge Engine for accurate, context-aware responses."
- CTA：高度 40px，白底黑字，圆角，文本 "Book a Demo"（14/22）
- 阶段控制：仅在 `stage === 'hands'` 时淡入（`AsciiHandsFooter` 通过同一 CustomEvent 广播；或用简单的 setTimeout：视频 stage 结束后延迟 200ms 淡入）

## 技术要点
- 不修改 IntroVideo / 手部 canvas 内部；仅新增覆盖层
- 全部使用 semantic tokens + 明确的 Tailwind 类，颜色不写死到组件外
- 保证 pointer-events 分层不阻挡 canvas 上的点击/滚轮
- 响应式：nav 在 <768px 折叠为汉堡（本轮先只做桌面版占位，移动端后续迭代）

## 交付
修改 3 个文件、新增 2 个文件：
1. `src/routes/__root.tsx` — 加字体 link
2. `src/styles.css` — 全局字体
3. `src/routes/index.tsx` — 组合布局
4. `src/components/SiteNav.tsx`（新）
5. `src/components/HeroCopy.tsx`（新）
6. `src/components/AsciiHandsFooter.tsx` — 只加 1 行 `dispatchEvent` 广播 stage/背景变化，供 nav 自适应
