## 目标
在现有的整体 parallax 位移之上，为每个字符增加**细微角度倾斜**和**深度差异位移**，让手掌在悬浮时呈现出源站那种"每个字符都在轻微响应鼠标"的立体感，而不是整块图像平移。

## 观察源站
好几种细节叠加：
1. 整体轻微朝鼠标方向漂移（已实现）。
2. **每个字符围绕自身中心做小角度旋转**，旋转量随该字符到光标的相对位置和距离变化——像光标在"吹动"字符。
3. **深度层次位移**：越亮（越靠近手掌高光/前景）的字符位移更大，暗部位移小，营造伪 3D 视差。

## 修改文件
`src/components/AsciiHandsFooter.tsx`

## 实现步骤

### 1. 新增常量
```
const TILT_MAX_DEG = 6;        // 单字符最大倾斜角
const TILT_FALLOFF = 260;      // px，超过此距离倾斜衰减到接近 0
const DEPTH_PARALLAX = 0.6;    // 亮部相对暗部的额外位移倍率
```

### 2. 每 cell 深度位移
在计算 `offX/offY`（当前的整体 parallax）后，每个 cell 额外乘一个深度因子：
```
const depth = 0.4 + bb * DEPTH_PARALLAX;   // 暗部 0.4x，亮部 ~1x
const cellOffX = offX * depth;
const cellOffY = offY * depth;
```
让亮部凸出、暗部后退。

### 3. 每 cell 倾斜角
计算 cell 中心到平滑光标 `(discX, discY)` 的向量，用其角度和距离衰减出 tilt：
```
const dx = c.x + CELL_W/2 - discX;
const dy = c.y + CELL_H/2 - discY;
const dist = Math.hypot(dx, dy);
const falloff = Math.max(0, 1 - dist / TILT_FALLOFF);
// 用 dx 的符号 + dy 分量制造"绕光标切向旋转"的感觉
const angle = (dx / TILT_FALLOFF) * TILT_MAX_DEG * (Math.PI/180)
              * falloff * intensity;
```
仅当 `intensity > 0.01` 时才计算，避免无 hover 时开销。

### 4. 绘制时用 transform
把当前 `ctx.fillText(ch, x, y)` 包一层：
```
if (angle !== 0) {
  ctx.save();
  ctx.translate(cx, cy);        // cx/cy = cell 中心
  ctx.rotate(angle);
  ctx.fillText(ch, -CELL_W/2, FONT_PX/2 - 1);  // 相对偏移
  ctx.restore();
} else {
  ctx.fillText(ch, x, y);       // 快速路径，无 hover 时不变
}
```
outline 描边层同样走这个 transform 分支，保持字符与描边一起旋转。

### 5. 性能
- 只有 `intensity > 0.01` 时才进入 tilt/transform 路径；静止和无鼠标时走原快速路径，性能不变。
- save/restore 只对可见 cell 触发（intro 阶段跳过 `armT > introProgress` 的 cell 已生效）。

## 验证
1. `bun run build` 通过。
2. Playwright 截图：鼠标停在左手食指、右手手掌不同位置，观察附近字符呈微小切向旋转，亮部字符位移比暗部略大；鼠标离开后 tilt 平滑归零。

## 预期
- Hover 时不再是"一整块图平移"，而是每个字符都轻微响应，越靠近光标越明显、越亮越靠前，符合源站细腻的手感。
- 无 hover 时视觉与性能保持现状。
