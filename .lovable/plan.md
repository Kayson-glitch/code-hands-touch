## 目标
让点击手部时的马赛克扩散/收回不再是纯 `easeInOutCubic` 的匀速感，而是带轻微"弹性"回弹，动作更有生命力，同时避免过度晃动影响清晰度。

## 方案（仅改 `src/components/AsciiHandsFooter.tsx`）

1. **替换缓动函数**
   - 展开阶段：用 `easeOutBack`（轻量参数 `s ≈ 1.4`）替代 `easeInOutCubic`，让马赛克圆盘冲到目标半径后回弹一次再稳定。
   - 收回阶段：用 `easeInBack`（`s ≈ 1.2`），先轻微反向"蓄力"再快速收缩，比现在的匀速收回更利落。
   - 保留 `progress` 0→1 线性推进逻辑，只在读取时切换缓动，保证中途反复点击不会跳变。

2. **时长微调匹配弹性**
   - `LOCK_EXPAND_MS`: 520 → 620（给回弹留时间，避免弹跳被截断）。
   - `LOCK_COLLAPSE_MS`: 380 → 340（`easeInBack` 前段慢，整体缩短保持利落）。

3. **半径附加"过冲"**
   - 在展开的最后 15% 阶段，对 `lockLR/lockRR` 叠加一个 `sin` 衰减的 `±3%` 半径脉冲，让圆盘边缘有一次轻微呼吸，加强弹性观感。收回阶段不加。

4. **保护现有行为**
   - 悬停 hover、intro 生长、mosaic 参数、字符流全部不动。
   - 中途再次点击时，`target` 翻转仍然平滑：新缓动函数在 `progress ∈ [0,1]` 上单调段占主导，`Back` 的过冲只在末段发生，反向切换不会造成跳变（若担心可在切换瞬间把 `progress` 做一次镜像即可，代码里已具备 `dir` 判定，安全）。

## 技术要点
- 新增两个纯函数 `easeOutBack(t, s=1.4)`、`easeInBack(t, s=1.2)`，放在 `stepLock` 附近。
- 在读取 `lockLE / lockRE` 时按 `dir`（当前 `target`）选择缓动：目标为 1 用 `easeOutBack`，目标为 0 用 `easeInBack`。
- 过冲脉冲仅在 `target===1 && progress>0.85` 时启用：`radius *= 1 + 0.03 * sin((progress-0.85)/0.15 * π) * (1-progress)`。

## 验证
- Playwright：进入首页 → 分别点击左右手 → 截图三帧（扩散中、稳定、收回中）确认弹性可见且无跳变；连续快速点击不出现闪烁。
