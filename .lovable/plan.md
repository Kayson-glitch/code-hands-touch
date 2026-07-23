# 第二屏交互优化

## 1. 故障风扫描线全局化（`src/components/GlitchGrainOverlay.tsx` + `src/routes/index.tsx`）
- 将 overlay 的 `zIndex` 从 60 提升到 200，确保永远浮在导航栏、slogan、以及新叠上来的第二屏之上。
- 保持只在 `visible=true`（视频加载完成后）时显示；扫描线密度、样式不变。
- 因为 overlay 是 `position: fixed`，扩到 z:200 后所有黑底区域（hero、扩散黑屏、slogan）都会自动叠加扫描线。

## 2. 第二屏「覆盖」第一屏的滚动效果（`src/routes/index.tsx` + `src/components/SloganSection.tsx`）

当前行为：第二屏在文档流下方，滚动时第一屏被向上顶出视口。

目标行为：第一屏固定不动，第二屏从下方向上滑入并覆盖第一屏。

### 实现
在 `src/routes/index.tsx` 里将 hero 组重构为固定层 + 占位滚动区：

```tsx
{/* 固定的第一屏层 */}
<div style={{ position: "fixed", inset: 0, zIndex: 1 }}>
  <AsciiHandsFooter ... />
  <HeroCopy />
  <FinChatDock />
</div>

{/* 占位：撑出 100vh 让页面能滚动到第二屏 */}
<div style={{ height: "100vh" }} aria-hidden />

{/* 第二屏：正常文档流，但 z-index 高于 hero，从下方覆盖上来 */}
<SloganSection />
```

在 `SloganSection` 上：
- 加 `position: relative; zIndex: 10;`（保持在 hero 之上、overlay 之下）
- 其余样式（黑底、100vh、字体动画）不变

`SiteNav` 已经是 `fixed` + zIndex 80，保持在 hero 层之上、扫描线之下 —— 无需改动。

## 兼容性
- `IntroVideo` 使用 `wheel` 事件驱动，与页面 `scroll` 位置无关，添加滚动占位不会影响视频滚动播放。
- 新增的 100vh 占位只会在视频完成、进入 hero 之后被用户感知；用户向下滚就自然进入第二屏。
- SloganSection 内部原本用 `getBoundingClientRect` + `IntersectionObserver` 计算词语显现进度，改成 `position: relative` 后仍然生效，无需改逻辑。

## 不改动
- 视频、扩散动画、字符手、导航栏视觉、hero 文案样式、slogan 文本与逐词动画曲线，均保持原样。
