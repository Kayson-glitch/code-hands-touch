## Goal
保持 reveal disc 为圆形，但把破碎/拖尾噪声"定向"到手臂线条方向，让 hover 时的边缘迸溅像墨迹沿手臂流动。

## 改动范围
仅 `src/components/AsciiHandsFooter.tsx`。

## 关键观察
- 两只手臂大致从底部左右斜向汇聚到中上部；左臂走向约 +60°（右上），右臂 -60°（左上）。
- 使用鼠标相对画布水平中心的位置决定使用左臂还是右臂角度：`sideSign = discX < w/2 ? +1 : -1`。
- 定义 `ARM_ANGLE_RAD = (60 * Math.PI) / 180`；实际角度 = `sideSign * ARM_ANGLE_RAD`（注意 canvas y 向下，`sin` 取负号让方向朝画面上方）。

## 实现步骤

1. **新增常量**
   - `ARM_ANGLE_DEG = 60`
   - `ARM_ALIGN_STRENGTH = 0.85`（噪声在手臂方向 vs 垂直方向的比重差；0 = 各向同性，1 = 完全定向）

2. **在渲染循环里预计算方向向量**（每帧一次，位于 `showGooey` 计算后）
   - `const sideSign = discX < w / 2 ? 1 : -1;`
   - `const armRad = (ARM_ANGLE_DEG * Math.PI) / 180;`
   - `const armDx = Math.cos(armRad);`（沿画面 x）
   - `const armDy = -Math.sin(armRad) * sideSign;`（y 轴向下需反号；左侧手臂朝右上，右侧朝左上）

3. **改造每个 cell 的噪声混合**（当前 `ddx / ddy / midFreq / highFreq / microFract` 段）
   - 用 `d` 做半径判定不变。
   - 计算方向系数：
     - `const nx = d > 1e-5 ? ddx / d : 0;`
     - `const ny = d > 1e-5 ? ddy / d : 0;`
     - `const along = nx * armDx + ny * armDy;`   // -1..1，沿手臂
     - 定向权重 `const dirW = 1 + ARM_ALIGN_STRENGTH * (along * along - 0.5) * 2;`
       - along²=1（沿手臂）→ `1 + ARM_ALIGN_STRENGTH`
       - along²=0（垂直手臂）→ `1 - ARM_ALIGN_STRENGTH`
   - `midFreq` 使用旋转后的坐标让 lobes 沿手臂拉伸：
     - `const localI = i * armDx + j * armDy;`
     - `const localJ = -i * armDy + j * armDx;`
     - `midFreq = Math.sin(localI * 0.30 + localJ * 0.90 + seed * 1.5) * GOOEY_NOISE * 5`
       （沿手臂低频、垂直手臂高频 → 视觉上是延手臂方向的长条 chips）
   - `highFreq` 和 `microFract` 保持公式，但乘以 `dirW`。
   - `lowFreq` 保持不变（属于整体呼吸）。
   - 最终 `distorted = d + lowFreq + midFreq * dirW + wobble + highFreq * dirW + microFract * dirW;`
     - 效果：破碎边缘沿手臂方向被大幅推拉，垂直方向被压缩 → 迸溅方向对齐手臂。

4. **保持不变**
   - `GOOEY_RADIUS_UV / SOFTNESS_UV / GOOEY_NOISE` 数值不变（形状主体仍是圆）。
   - 颜色、字体、scramble、parallax、动态 easing 全不动。
   - `prefersReducedMotion` 不受影响。

## 验证
- `bun run build` 通过。
- Playwright 截图两组：
  - 鼠标放在画面左半侧，观察噪声 chips 是否沿右上方向延伸。
  - 鼠标放在右半侧，chips 应镜像沿左上方向。
- 若视觉方向与实际手臂不吻合，仅需微调 `ARM_ANGLE_DEG`（35–65 之间）而不改结构。
