# 修复扩散阶段闪屏

## 现象定位

`src/components/IntroVideo.tsx` 里扩散（burn-through）阶段目前是"自动定时 + 可被滚轮打断"的混合模式，几处状态在同一帧内互相拉扯，导致画面闪一下：

1. **`burnStartTs` 会被重置**：`videoProgress` 是从平滑后的 `progress` 派生的，只要用户向上滚一点点，`progress` 略低于 `VIDEO_FRACTION`，就会进 `else if (burnActive)` 分支，把 `burnActive = false; burnStartTs = -1`。下一帧再越过阈值，burst 又从 0 开始 → 黑洞和光环瞬间消失又重新出现 = 闪屏。
2. **`compositeProgress` 会跳变**：它由 `min(progress, VIDEO_FRACTION) + burstProgress * (1-VIDEO_FRACTION)` 合成，当 `burstProgress` 从 0.6 秒突然掉回 0 时，`uProgress` 阶梯式回退，导致 shader 里所有依赖 `uProgress` 的项（色差包络、噪点）一起跳。
3. **`uTime = compositeProgress * 18` 也跟着跳**：shader 里所有 `sin(uTime * ...)` 相位瞬间断裂，出现一帧亮闪。
4. **`fire()` 触发瞬间的接管**：`burstProgress >= 1` 时立即回调 `onEnded`，父组件切换到 ASCII 场景，如果此时 canvas 还没画最后一帧的稳定状态，也会看到黑/白闪。

## 修复方案

只调整时间/状态推进逻辑，不动 shader 和视觉参数：

1. **让扩散不可逆、单向推进**
   - 一旦 `videoProgress` 第一次达到 1，`burnActive` 设为 `true` 后 **不再被回退分支重置**；删掉 `else if (burnActive) { burnActive = false; burnStartTs = -1 }`。
   - `targetProgress` 在扩散启动后钳制在 `VIDEO_FRACTION`，用户继续向上滚只影响一个内部 hint，不再拉扯 `burnStartTs`。

2. **`uTime` 与 `uProgress` 单调化**
   - `uTime` 改用一个只增不减的独立累加器（`burnStartTs` 存在时按 `dt` 累加），避免回退造成的相位断裂。
   - `compositeProgress` 在扩散阶段固定用 `VIDEO_FRACTION + burstProgress * (1-VIDEO_FRACTION)`，前半段 `progress` 的抖动不再影响它。

3. **`fire()` 前留一帧稳定态**
   - `burstProgress >= 1` 时不立刻 `fire`，先把 `uBurn = 1` 再至少渲染一帧（`lastRenderedProgress` 更新后）再回调 `onEnded`，避免父组件切换瞬间的空帧闪烁。

4. **收尾时暂停视频、锁定纹理**
   - 扩散启动即 `pauseVideo()` 一次并把 `mediaFrameDirty` 清零，之后不再上传视频纹理，防止 `videoTex.needsUpdate` 在扩散末段偶发触发一次画面刷新造成闪烁。

## 影响范围

- 仅修改 `src/components/IntroVideo.tsx` 的 loop 内状态推进（约 20 行）。
- 不改 shader、参数面板、滚轮映射（上一步刚调的手感参数保持不变）。
- 不改父组件、不改 ASCII/HeroCopy/导航栏。

## 验收

- 视频滚到末尾后扩散一次到底、无闪；
- 扩散过程中反向滚轮：视频不倒放、扩散不回退、无闪；
- 扩散完成切到 ASCII 场景时没有一帧黑/白闪。
