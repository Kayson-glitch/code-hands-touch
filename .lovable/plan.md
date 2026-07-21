## 目标

- 「标题组 + 手部」作为一个整体在首屏容器内垂直居中。
- 底部 "Synergy.AI" 大字继续吸附在首屏底部（与整体独立分层）。

## 现状（已核对）

- `HeroCopy.tsx`：`absolute top-0 paddingTop:22vh`（约占 ~20vh 高：标题 112px + 副标题 24px + 按钮 40px + 间距 ≈ 200px）。
- `AsciiHandsFooter.tsx` L1295–1306：canvas `absolute bottom-0 height:62vh`（下沉到底）。
- Wordmark：`absolute bottom-0 height:28%`（吸底，独立层）。

现在标题在上部、手在下部，两者之间存在空白且整体重心偏下。

## 改动

用一个「相对定位、100vh、flex 垂直居中」的分组容器，把标题与手部作为整体在视口垂直居中；wordmark 与该组解耦，继续 `absolute bottom-0` 吸底。

### 1. `AsciiHandsFooter.tsx`

- canvas 从 `absolute bottom-0` 改为跟随组内流式布局的一环：保持 canvas 结构不变，但把它放进新的居中组容器中，样式改为 `position:relative; height:56vh; width:100%`。
- 新增分组：在 `AsciiHandsFooter` 根节点里插入
  ```
  <div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
    <HeroSlot />   // 由 HeroCopy 渲染到这里
    <canvas ... />
  </div>
  ```
  由于 HeroCopy 已经是独立组件，为最小侵入：**保留 HeroCopy 位置策略不变**，改为用 vh 精算重心：
  - `HeroCopy` `paddingTop`: `22vh` → `12vh`
  - canvas `height`: `62vh` → `56vh`；`bottom:0` → `bottom:auto; top:32vh`
  这样组合块（标题 ~20vh + 手 56vh = 76vh）居中于 100vh：上 12vh、下 12vh，视觉整体居中。

### 2. 保持不动

- Wordmark 容器仍为 `absolute bottom-0 height:28%`（吸底不变，位于 canvas 之下的层，被 canvas 前景遮挡的部分保持原状）。
- 手部 canvas 内部渲染/交互逻辑不变（使用 `getBoundingClientRect`，位置变化不影响 hover / mosaic / click）。
- HeroCopy 内部结构、字号、动画不变。

## 交付

- 修改 `src/components/AsciiHandsFooter.tsx`（canvas：`bottom:0/height:62vh` → `top:32vh/height:56vh`）
- 修改 `src/components/HeroCopy.tsx`（`paddingTop`: 22vh → 12vh）
