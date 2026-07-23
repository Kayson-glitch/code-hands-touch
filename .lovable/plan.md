## 目标

在第一屏（fixed hero 容器）背景最底层加入 React Bits 的 `Aurora` WebGL 极光效果，作为纯装饰底色。仅第一屏可见，第二屏（SloganSection）及后续内容不受影响；开场视频、字符手、故障风扫描线、标题、导航、对话框全部保留在其之上。

## 依赖

- `bun add ogl`

## 新增文件

- `src/components/Aurora/Aurora.jsx` — 使用你提供的完整源码（原样）。
- `src/components/Aurora/Aurora.css` — `.aurora-container { width:100%; height:100% }`。

放到独立目录避免和现有 `.tsx` 组件混淆；`allowJs` 若未开则用 `.tsx` 版本（把 props 加最小 `any` 类型），实现同源。

## 接入位置

`src/routes/index.tsx` 内 fixed hero 容器（`position:fixed; inset:0; zIndex:1`）中，在 `AsciiHandsFooter` 之前插入 Aurora 包裹层：

```tsx
<div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none" }}>
  <Aurora
    colorStops={["#185DFF", "#8B22FF", "#E81A8A"]}
    blend={0.5}
    amplitude={1.0}
    speed={0.5}
  />
</div>
<AsciiHandsFooter ... />
<HeroCopy />
```

颜色沿用品牌渐变（蓝→紫→粉红），与标题 `Synergy.AI` 渐变呼应。

## 层级校验（第一屏内）

```text
z 0  Aurora (新)
z 1  video / burst / ASCII hands / GlitchGrainOverlay (现有 AsciiHandsFooter 内部结构不变)
z 30 HeroCopy
z 80 SiteNav
```

Aurora 只挂在 fixed hero 容器内 → 随第一屏做 parallax、随第二屏上滑被覆盖，天然只在第一屏可见。

## 不做的事

- 不修改 `AsciiHandsFooter`、`IntroVideo`、`GlitchGrainOverlay`、`SloganSection`、导航、对话框、标题的任何代码或时序。
- 不改背景黑色基底（Aurora 在其之上、视频/手之下，透明混合）。
- 不给 Aurora 加入场动画、不接扩散事件。

## 验证

Playwright 截图三个状态：开场视频阶段（应看不到 Aurora，被视频盖住）、扩散完成第一屏（Aurora 在字符手/标题背后隐约流动）、滚动进入第二屏（Aurora 被 SloganSection 覆盖，且第二屏本身无 Aurora）。
