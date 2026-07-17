## Goal
让 reveal disc 的拖尾感在快慢鼠标移动时手感一致：慢速移动时保留柔和的墨滴扩散拖尾，快速移动时自动加快跟随，避免拖尾拉得过长导致 disc 严重滞后。

## 改动范围
仅修改 `src/components/AsciiHandsFooter.tsx`，属于前端表现层。

## 实现步骤

1. **跟踪鼠标速度**
   - 在 `mouseRef` 之外新增 `mouseSpeedRef`（number，px/ms 的平滑值，初始 0）。
   - 在 `onMove` / `onTouch` 中，用上一次事件的 `x/y/time` 计算 `instSpeed = dist / max(1, dtEvent)`，然后 `mouseSpeedRef.current += (instSpeed - mouseSpeedRef.current) * 0.35` 做 EMA 平滑，防抖。
   - `onLeave` 时把速度衰减目标设为 0（由下方帧循环里的衰减逻辑处理）。

2. **在渲染帧里把速度映射为动态 lerp 系数**
   - 常量新增：
     - `DISC_LERP_MIN = 0.08`（现值，慢速）
     - `DISC_LERP_MAX = 0.22`（快速上限，仍保留细微惯性）
     - `INTENSITY_LERP_MIN = 0.05`
     - `INTENSITY_LERP_MAX = 0.12`
     - `SPEED_REF = 2.0`（px/ms，约等于快速划过的手感阈值）
   - 每帧：
     - 让 `mouseSpeedRef.current *= Math.exp(-dt / 120)`，长时间不动时自然衰减到 0。
     - `const k = Math.min(1, mouseSpeedRef.current / SPEED_REF);`
     - `const discLerp = DISC_LERP_MIN + (DISC_LERP_MAX - DISC_LERP_MIN) * k;`
     - `const intensityLerp = INTENSITY_LERP_MIN + (INTENSITY_LERP_MAX - INTENSITY_LERP_MIN) * k;`
   - 用 `discLerp` / `intensityLerp` 替换原来的常量在 lerp 表达式里的使用点（第 298、307-308 行）。
   - 保留原 `DISC_LERP` / `INTENSITY_LERP` 常量作为 MIN 值删除，改为上面新的 MIN/MAX 常量以避免命名混乱。

3. **保持不变**
   - `GOOEY_*` 噪声参数、亮度权重、字体、采样、parallax、scramble 都不动。
   - `prefersReducedMotion` 时依旧强制 target intensity=0，不受速度影响。

## 手感目标
- 慢速悬停：拖尾仍是缓慢墨滴扩散（等同当前 0.08 / 0.05 表现）。
- 快速甩过：disc 不会被落下一大截，跟随明显更紧，破碎边缘不会被拉成长条。
- 停止后：速度 EMA 在 ~120ms 内衰减回 0，自动回到"慢速柔和"模式。

## 验证
- `bun run build` 通过。
- Playwright 脚本模拟两种移动：
  1. 慢速沿水平轴平移（每帧 ~1px），截图确认拖尾柔和，与之前一致。
  2. 快速甩动（一次 mousemove 跨越 400px），截图确认 disc 紧跟末端，不会出现长条拖影。
