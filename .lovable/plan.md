## 目标
让第二屏（SloganSection）的文字入场动效在用户还处于第一屏滚动阶段时就开始渐进出现，而不是等到第二屏完全推入视口后才启动。

## 现状
`src/components/SloganSection.tsx`:
- `progress = -rect.top / (offsetHeight - vh)`
- 只有当 slogan 区域顶部触达视口顶部（此时第二屏已完全覆盖第一屏）才为 0，之后才开始揭示文字。
- IntersectionObserver `rootMargin: "0px"`，section 尚未进入视口时不会挂载 scroll 监听。

## 方案
在 `src/components/SloganSection.tsx` 内做两处调整：

1. **提前触发监听**
   - IntersectionObserver 的 `rootMargin` 改为 `"100% 0px 0px 0px"`（或等价 `"100vh 0px 0px 0px"`），让 section 距离视口还差一个视口高度时就开始跟踪滚动、驱动 rAF。

2. **提前进度起点，保持终点不变**
   - 引入 `LEAD_IN = vh`（一个视口高度的提前量，可微调 0.8–1.2 vh 之间，先用 1.0 vh）。
   - 计算方式：
     ```
     scrolled = LEAD_IN - rect.top          // rect.top = vh 时 progress=0
     travel   = LEAD_IN + (offsetHeight - vh) // 终点仍是当前 pinned 结束位置
     progress = clamp(scrolled / travel, 0, 1)
     ```
   - 效果：当第一屏还在向上视差滚动、slogan 区域顶边刚从视口底部进入时，字符揭示动画就已经开始；到 sticky 结束时刚好完成，与现有节奏对齐。

3. **字符揭示节奏保持不变**
   - `reveal()` 中的 `span / overlap` 系数不变；仅因为总行程变长，前段揭示自然更缓、更连续，正好覆盖"第一屏滚动阶段"。

## 不改动
- 不修改 `src/routes/index.tsx` 的 fixed 视差、spacer 高度、层级、背景等。
- 不修改 SloganSection 的 260vh sticky 结构、样式、字号、模糊/透明参数。
- 不影响导航、Hero、扩散、扫描线等其他模块。

## 验收
- 在第一屏视差滚动（还能看到手/标题）过程中，第二屏文字已经开始由模糊→清晰、由低透明度→高透明度的渐进出现。
- 当第二屏 sticky 阶段结束时，文字揭示进度恰好为 1，无跳变。
- reduce-motion 用户仍直接看到 progress=1 的完成态。