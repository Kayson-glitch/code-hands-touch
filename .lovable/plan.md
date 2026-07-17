## 目标
把入场"生长前沿"从当前的**直线**（沿 60° 单一轴投影）升级为**沿手臂骨架的曲线**，让前沿在肘部自然弯折、指尖收拢，视觉上像视频里手臂真的从边缘伸出来。

## 现状与不足
- `armT` 通过 `cell · (cosθ, -sinθ)` 单一直线方向投影，等值线是斜 60° 的直线。
- 结果：前沿是一条直斜线扫过手臂，肘部/前臂/手掌被同一斜面切开，肘弯与手指部分同时显影，不像"伸出"。

## 方案：分段骨架路径 + 最近点参数化
为左右手臂各定义一条 3 段折线（近似骨架：肩→肘→腕→指尖），单位为 `targetRect` 归一化坐标 `(u, v)`，`u=0` 左边缘/`u=1` 右边缘，`v=0` 顶/`v=1` 底：

- **左臂**（4 个控制点，累计弧长 → armT）：
  - `P0 = (0.00, 0.90)` 肩/根（画面左下）
  - `P1 = (0.22, 0.62)` 肘
  - `P2 = (0.40, 0.48)` 腕
  - `P3 = (0.50, 0.50)` 指尖（接近画面中部）
- **右臂**：水平镜像。

对每个 cell：
1. 将其像素坐标转换到归一化 `(u, v)`。
2. 根据 `u < 0.5` 选左臂骨架，否则右臂。
3. 用 `pointToPolyline` 求该 cell 到骨架折线的**最近点及其累计弧长比 `s ∈ [0, 1]`**；`armT = s`。
4. **横向偏差惩罚**（可选）：`armT = s + k * perpDist / totalArc`（`k ≈ 0.15`）——离骨架越远的 cell 显影稍晚，让"墨迹"沿骨架先流出，肌肉/边缘略滞后，进一步强化"从骨架长出来"的观感。

## 实现细节（仅改 `src/components/AsciiHandsFooter.tsx`）
1. 新增常量：
   ```ts
   const ARM_SKELETON_L: [number, number][] = [
     [0.00, 0.90], [0.22, 0.62], [0.40, 0.48], [0.50, 0.50],
   ];
   // 右臂 = 左臂横向镜像 (1 - u)
   const SKELETON_PERP_WEIGHT = 0.15;
   ```
2. 在 `sampleImage` 计算 `armT` 的分支中，替换现有"单一轴投影 + min/max"逻辑为：
   - 预计算骨架累计弧长 `segLen[]` / `totalLen`。
   - 遍历 cell：`(u, v)` 归一化 → 选左/右骨架 → 遍历各段做点到线段最近点计算，记录最小 `perpDist`、对应弧长比 `s` → `armT = clamp01(s + SKELETON_PERP_WEIGHT * perpDist / 1.0)`。
3. 其余入场逻辑（`INTRO_DURATION_MS`、front-width、scramble/亮度/抖动、hover 禁用）**保持不变**——这次只改 `armT` 的定义。
4. `ARM_ANGLE_DEG` 依然用于 hover 的**破碎噪声方向**，只是不再决定入场路径。两者解耦。

## 不改动
- 采样管线、`Cell` 结构（`armT` 字段已存在，只改赋值方式）。
- Hover reveal disc、动态 easing、parallax、scramble tick、字体、颜色。
- `prefers-reduced-motion` 分支。

## 验证
- `bun run build` 通过。
- Playwright 截取 0.4s / 0.8s / 1.2s / 1.6s 四帧：
  - 0.4s：只有肩/前臂根部显影，肘及以后仍隐藏。
  - 0.8s：前沿位于肘部附近，前臂已完整。
  - 1.2s：前沿到手腕，手掌开始出现。
  - 1.6s：指尖完成，进入 hover 模式。
- 拖动鼠标验证 hover 破碎方向仍正确（`ARM_ANGLE_DEG` 未失效）。
- 若骨架控制点与实际图像稍有偏差，仅调 `ARM_SKELETON_L` 数值即可，无需改结构。

## 技术备注（折线最近点简要伪代码）
```ts
function nearestOnPolyline(pu, pv, pts, segLen, totalLen) {
  let best = { s: 0, perp: Infinity };
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay;
    const L2 = dx * dx + dy * dy;
    let t = ((pu - ax) * dx + (pv - ay) * dy) / Math.max(1e-6, L2);
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx, cy = ay + t * dy;
    const perp = Math.hypot(pu - cx, pv - cy);
    if (perp < best.perp) {
      best.perp = perp;
      best.s = (acc + t * segLen[i]) / totalLen;
    }
    acc += segLen[i];
  }
  return best;
}
```
