# 视差 + 底部对话框永远置底

## 1. 视差效果（`src/routes/index.tsx`）
第一屏当前 `position: fixed`，滚动时完全不动 —— 造成第二屏「盖上来」但第一屏零位移。改为让第一屏以约 0.35 倍速度向上平移，形成视差：

- 在 `Index` 内新增 `scrollY` state，用 rAF 节流的 `scroll` 监听更新。
- 给固定的第一屏包裹层加 `transform: translate3d(0, -scrollY * 0.35 px, 0)` 与 `willChange: "transform"`。
- 到达第二屏时（滚动距离 ≥ 1vh），第一屏向上偏移 ~35vh，被第二屏完全覆盖后不可见 —— 无副作用。

## 2. 底部对话框永远置底（`src/routes/index.tsx`）
`FinChatDock` 目前放在被视差平移的容器里，会跟着往上滑。把它从固定层里移出，作为兄弟节点独立渲染：

```tsx
{/* 视差第一屏 */}
<div style={{ position: "fixed", inset: 0, zIndex: 1, transform: `translate3d(0, ${-scrollY * 0.35}px, 0)` }}>
  <AsciiHandsFooter ... />
  <HeroCopy />
</div>

<SiteNav />
<div aria-hidden style={{ height: "100vh" }} />
<SloganSection />

{/* 永远置底 —— 不受视差影响，浮在所有内容之上 */}
<FinChatDock />
```

`FinChatDock` 内部已经是 `fixed bottom-6 z-30`，无需改动它本身。

## 不改动
扫描线、Slogan 组件、hero 内其它元素、导航栏、动画等。
