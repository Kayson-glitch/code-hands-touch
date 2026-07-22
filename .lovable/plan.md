## 同步光环与黑孔扩张

### 原因
当前用两条曲线驱动两个半径：
- `rOuter = (1 - (1-b)^3) * 1.9` — easeOutCubic，起步就冲得很快
- `rInner = smoothstep(0.10, 0.95, b) * 1.9` — 有 0.10 的启动延迟，明显滞后

所以画面上先看到一圈光环向外扩，随后黑孔才追上来，视觉上"环 → 洞"分离。

### 修复（仅 `src/components/IntroVideo.tsx`）
统一为**单一半径 + 单一曲线**，环恒在黑孔外沿：

- 定义 `float r = (1.0 - pow(1.0 - b, 3.0)) * 1.9;`（easeOutCubic）
- `float ringWidth = 0.10;`
- `float d = len - r + distort * 0.20;`（唯一带扰动的有向距离）
- **黑孔**：`burned = smoothstep(ringWidth * 0.35, -ringWidth * 0.15, d)`（在环内侧转为黑）
- **亮环**：`ring = smoothstep(ringWidth, ringWidth * 0.55, abs(d)) * (1.0 - burned)`
- 保留 `appear = smoothstep(0.0, 0.12, b)` 淡入
- 删除 `rOuter/rInner/bOuter/bInner/dOuter/dInner` 变量

这样环与孔来自同一条 `r`，扩张速率完全一致，环始终贴着黑孔外缘同步推进。

### 验证
build 后用 Playwright（1280×1800）：加载 preview → 触发预加载完成 → 滚动到视频末尾进入 burn → 在 burn 时长 2.6s 内每 ~500ms 截图一张（约 5 帧），肉眼确认每帧中亮环紧贴黑孔边缘、无先后差。截图存 `/tmp/browser/burn/screenshots/`，用 `code--view` 检阅后再向用户报告。

### 不变项
2.6s 时长、fbm 边缘扰动、`onEnded` 时机、滚动/锁定逻辑、颜色。
