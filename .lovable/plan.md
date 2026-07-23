## 目标

扩散动画结束进入第一屏后，元素分两阶段入场：
1. **阶段 A（先）** — 顶部导航栏 `SiteNav` + 底部对话框 `FinChatDock` 淡入
2. **阶段 B（后）** — 中间标题区 `HeroCopy` + 字符手 `AsciiHandsFooter`（hands stage）同时开始入场动画

## 现状

四个组件目前都监听 `app-bg-change: "dark"` 事件（burst 完成时派发），几乎同时开始各自动画：
- `SiteNav`：收到 `app-nav-visibility: "visible"` 或 4s 兜底后 260ms 淡入
- `FinChatDock`：`app-bg-change=dark` 后 850ms 淡入
- `HeroCopy`：`app-bg-change=dark` 立即 900ms blur/fade
- `AsciiHandsFooter`：切到 `stage="hands"` 时手臂开始 2400ms 生长

## 方案

统一由 burst 完成事件驱动，用固定时序错开两阶段，不改动画本身参数，只调整触发时机。

**时序（以 `app-bg-change=dark` 触发为 t=0）：**

```text
t = 0ms     背景变黑 / 进入 hero
t = 80ms    SiteNav 淡入开始 (260ms)
t = 80ms    FinChatDock 淡入开始 (现有过渡)
t = 640ms   HeroCopy blur/fade 开始 (900ms)
t = 640ms   AsciiHandsFooter 手臂生长开始
```

阶段间隔 ~560ms，保证 A 组件基本淡入完成后 B 组件才开始，避免视觉打架。

## 技术改动

仅四个文件，均只改触发时序：

1. **`src/components/SiteNav.tsx`**
   - `app-nav-visibility: "visible"` 事件收到后延迟 80ms 再 `setHidden(false)`
   - 兜底 timeout 保持 4000ms

2. **`src/components/FinChatDock.tsx`**
   - 把现有 `setTimeout(setVisible(true), 850)` 改为 80ms（与 nav 同步）

3. **`src/components/HeroCopy.tsx`**
   - `app-bg-change=dark` 后延迟 640ms 再 `setVisible(true)`

4. **`src/components/AsciiHandsFooter.tsx`**
   - 手臂 intro 动画启动点（进入 `stage="hands"` 时的 `introStartTs`）延迟 640ms 开始，或将手臂初始 opacity/progress 门控 640ms 后再开始推进
   - 只改 hands stage 的起始时间，不改 2400ms 生长曲线本身

## 不改动

- burst / 视频 / 扩散流程完全不变
- 各组件动画曲线、时长、参数保持现状
- 不改事件名或事件源

需要我按这个时序实施吗？如果 560ms 间隔偏长/偏短可以直接说数值，我在实施时套用。