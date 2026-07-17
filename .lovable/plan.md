## 目标
整体提升上一条推导紫色的明度，让它在暗色背景上更醒目，接近之前橙色版本的视觉亮度。

## 调整方案
- 保持色相 H≈260°、饱和度 S≈70% 不变。
- 将明度 V 从 87% 提升到 100%，得到 `#884DFF`（`rgb(136, 77, 255)`）。
- 暗部同步稍微提亮，保持明暗结构但避免剪影过黑：
  - 原暗部：`rgb(30, 20, 55)`
  - 新暗部：`rgb(40, 28, 75)`（适度提亮，仍保持低饱和深紫）

## 具体修改
更新 `src/components/AsciiHandsFooter.tsx`：
- 基础色阶：
  ```
  // Base purple derived from the original orange by keeping similar HSV
  // saturation and shifting hue to purple, with raised value for brightness:
  //   shadow rgb(40, 28, 75) → highlight rgb(136, 77, 255)
  let r = 40 + bb * 96;
  let g = 28 + bb * 49;
  let bl = 75 + bb * 180;
  ```
- 高亮色 `HR/HG/HB` 保持 `235, 225, 255`（已与新紫色匹配）。

## 验证
- 运行 `bun run build` 通过。
- 截图对比，确认手掌比当前 `#7643DE` 版本更亮，同时保留紫色色相。

## 预期结果
- 整体明度提升，暗部不再死黑，亮部紫色更饱和醒目。
- 如果觉得仍不够亮，下一步可继续提升饱和度或进一步提亮暗部。