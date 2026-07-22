## 问题定位

Burn 结束后中间那段"黑屏"其实是两层叠加造成的：
1. `IntroVideo` 在 burn 完成后仍以 `zIndex:60` 挂载 500ms，其最终画面就是一个整屏黑洞，把下方 canvas 完全盖住。
2. `AsciiHandsFooter` 的 canvas 用 300ms 淡入 + 2400ms 手臂入场动画，早期几乎全黑。
   →  综合观感：burn 结束 → 停顿一段黑 → 手才慢慢长出来 → 标题淡入。

## 目标

Burn 完成的那一帧立刻看到字符手部入场动画，然后标题/导航/对话框再渐入。

## 修改方案（仅 UI/时序，不动业务逻辑）

1. **`src/components/AsciiHandsFooter.tsx` — `handleIntroEnded`**
   - `setStage("hands")` 后立即 `setOrbMounted(false)`（去掉 500ms 延迟），让 `IntroVideo` 立刻卸载，露出下面的黑底 + canvas。
   - `handoffBlack` 兜底层保留，但缩短到 ~300ms 再移除，防止卸载那一帧漏白。
   - canvas 淡入时间从 300ms → ~120ms，让手部入场动画从第一帧就可见。

2. **`src/components/HeroCopy.tsx` / `SiteNav.tsx` / `FinChatDock.tsx`**
   - 现在它们监听 `app-bg-change` 立即触发 fade（700ms），会和手部入场"抢镜"。
   - 改为收到 dark 事件后 **延迟 ~600ms** 再开始淡入（给手臂长出一段时间），淡入时长保持 700ms。可以在各组件本地 `setTimeout` 实现，不新增全局状态。

3. **不改动**：burn shader、预加载、手部动画曲线、字符效果、点击马赛克等。

## 验收

- 用 Playwright 在 burn 结束瞬间连续截图（0ms / 150ms / 400ms / 800ms / 1500ms），确认：
  - 0–150ms：已看到手臂开始从两侧生长；
  - 无整屏纯黑停顿；
  - 标题/导航在手臂初步成型后（~600–800ms）才开始淡入。
