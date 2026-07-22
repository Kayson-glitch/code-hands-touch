略微加快字符手的入场动画，让它与 hero 文字/按钮的淡入节奏更同步。

## 当前节奏

- Hero 文字：从背景变黑 (`app-bg-change`) 后再等 280ms 开始，900ms 淡入完成，约 1180ms 后完全可见。
- 字符手：当前 `INTRO_DURATION_MS = 2400ms`，再加上右臂 `120ms` 的错峰，约 2520ms 后完全出现，比 Hero 慢约 1.3s。

## 改动内容

1. **缩短 `src/components/AsciiHandsFooter.tsx` 中的入场时间**
   - `INTRO_DURATION_MS`: 2400ms → **1600ms**（只轻微加速，保留手腕处放缓）。
   - `INTRO_SIDE_STAGGER_MS`: 120ms → **70ms**，保持两只手的错峰但同步更快。
   - 调整 `INTRO_WRIST_ANCHOR` 或 Hermite 曲线参数，让时间压缩后「手腕处放缓」仍然明显。

2. **同步 hero 的触发延迟**
   - `src/components/HeroCopy.tsx` 中，背景变黑后的等待从 `280ms` 缩短到 **150ms**，让 hero 文字和手部动画几乎同时开始、几乎同时完成。

3. **验证**
   - 构建项目无错误。
   - 在预览中确认手部动画不再比 hero 明显慢，入场收尾更同步。

## 技术细节

- 保持原有的 Hermite 缓动（快启动、手腕减速）不变，只调整时间参数。
- 不改动其他 hover、click-lock、马赛克、流动等效果。