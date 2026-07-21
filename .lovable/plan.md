## 目标
删除所有扩散（LiquidBurst）相关代码，视频播放完直接进入手部动画阶段，其他不变。

## 改动

1. **删除文件**
   - `src/components/LiquidBurst.tsx`

2. **修改 `src/components/AsciiHandsFooter.tsx`**
   - 移除 `LiquidBurst` 的 import 与渲染
   - 移除 stage 中的 `"spread"` 状态（及 `spreadMs`、burst 起点坐标计算、相关 timer/ref）
   - 视频 `onEnded`（含 fallback timer）后直接从 `"intro"` 切到 `"hands"` 阶段
   - 保留背景色切换逻辑（视频结束时切到黑底），保留手部动画与其他所有效果不变

3. **保留不变**
   - `src/components/IntroVideo.tsx`（模糊背景 + contain 布局、最后一帧冻结、fallback 时长）
   - 手部 ASCII 动画、hover、点击马赛克、字符流动等全部原有效果
