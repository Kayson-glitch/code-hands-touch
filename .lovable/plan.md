## 手部位置上移 20px

### 当前状态
- 手部 canvas 位于 `src/components/AsciiHandsFooter.tsx` 第 1276–1277 行，当前样式为 `top: 55vh; height: 45vh`。
- 其它效果（ASCII、hover、马赛克、点击、扩散、球体/视频过渡、UI 等）保持不变。

### 修改方案
1. 将手部 canvas 的 `top` 从 `55vh` 改为 `calc(55vh - 20px)`，保持 `height: 45vh` 不变。
   - 这样整个手部区域在视口内精确上移 20px，底部不压缩、效果不变形。
2. 不修改任何其它常量、动画、交互逻辑。

### 验证
- 通过预览确认手部视觉上整体向上移动约 20px。
- 检查手部与标题、底部 dock 的间距没有异常冲突。