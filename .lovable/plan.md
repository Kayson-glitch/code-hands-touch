# 更新按钮样式（仅调整这两个按钮，其它保持不变）

## 1. 导航栏 "Book a Demo" 按钮（`src/components/SiteNav.tsx`）
- 圆角：`rounded-full` → `rounded-[8px]`
- 字重：`font-medium` → `font-normal`（regular）
- 其余尺寸、颜色、反相逻辑不变

## 2. 标题区 "Book a Demo" 按钮（`src/components/HeroCopy.tsx`）
- 圆角：`rounded-full` → `rounded-[10px]`
- 应用 Magic UI RainbowButton 效果（仅此按钮）：
  - 底部一圈流动彩虹光晕（模糊后向下溢出，形成 glow）
  - 按钮本体保留白底黑字，hover 微放大保留
  - 使用给定的 5 个 rainbow 颜色变量，颜色循环动画约 2s

## 技术实现
### `src/styles.css`
在 `@theme` 里加入 rainbow 色板变量与关键帧：
```css
--color-rainbow-1: #ff1245;
--color-rainbow-2: #d018ff;
--color-rainbow-3: #185dff;
--color-rainbow-4: #4b3aff;
--color-rainbow-5: #e81a8a;

@keyframes rainbow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
```
（与已有 `synergy-gradient-flow` 并存，不冲突。）

### `src/components/HeroCopy.tsx`
将现有 `<button>` 改造为 rainbow 风格：
- 外层容器 `position: relative`，`overflow: visible`
- 使用伪层（`::before` 通过内联 span 或额外 div）在按钮底部放置模糊的彩虹条：
  - `bottom: -20%`, `height: 20%`, `width: 100%`
  - `filter: blur(1rem)`
  - `background: linear-gradient(90deg, var(--color-rainbow-1), var(--color-rainbow-2), var(--color-rainbow-3), var(--color-rainbow-4), var(--color-rainbow-5), var(--color-rainbow-1))`
  - `background-size: 200%`, `animation: rainbow 2s linear infinite`
- 按钮本体也叠加同款流动渐变作为边框光（可选：直接给按钮加同款 `background-size/animation` 于底纹层）
- 保持 `rounded-[10px]`, `bg-white text-black`, `hover:scale-[1.03]`

## 不改动
- 其它任何按钮、组件、动画、布局
