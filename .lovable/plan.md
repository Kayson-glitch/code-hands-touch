## 目标
微调 hover 时的**深度视差**与**角度倾斜**，让整只手在光标经过时呈现源站那种"字符像被磁场牵引"的连续、有节奏的响应，而不是当前均匀的线性变化。

## 现状问题
1. `angle = (dxc / TILT_FALLOFF) * ...` — 只用了 x 分量，光标垂直上下时字符几乎不转；缺少"绕光标旋转"的切向感。
2. 距离衰减是线性 `1 - dist/FALLOFF`，边缘生硬。
3. 深度只取 `bb`（亮度），指尖并没有比手背更凸出，缺乏源站那种指尖领先的层次。
4. tilt 直接跟随光标，光标快速移动时字符会瞬跳。

## 修改文件
`src/components/AsciiHandsFooter.tsx`

## 实现步骤

### 1. 切向 tilt（swirl 感）
用 cell→光标向量的**法向量**驱动旋转，让字符像围绕光标切向摆动：
```
const dxc = cx - discX, dyc = cy - discY;
const dist = Math.hypot(dxc, dyc);
// 归一化，取法向（垂直于半径）
const nAngle = Math.atan2(dyc, dxc);
// 用 sin(nAngle) 让"上下方向"也产生倾斜
const tangential = Math.sin(nAngle - Math.PI / 2);  // = -dxc/dist
// 但保留一点径向反馈让离得越近字符略被"推开"
angle = (dxc / TILT_FALLOFF) * tiltScale * falloff;
```
调整为使用 `dxc + 0.5*dyc*sign` 的组合，或者直接：
- 主分量：`dxc / TILT_FALLOFF`（水平位移驱动旋转）
- 次分量：`dyc / TILT_FALLOFF * 0.4`（垂直也贡献轻微倾斜，让正上/正下时不为 0）
```
angle = ((dxc + dyc * 0.35) / TILT_FALLOFF) * tiltScale * falloff;
```

### 2. 平滑 falloff（smoothstep）
```
const t = Math.min(1, dist / TILT_FALLOFF);
const falloff = 1 - t * t * (3 - 2 * t);   // smoothstep
```
让远端字符缓慢淡出，不再有明显的作用圈。

### 3. 深度视差引入 armT
指尖 (`armT ≈ 1`) 应比手根 (`armT ≈ 0`) 位移更多，配合亮度：
```
const depth = hoverActive
  ? 0.35 + bb * 0.45 + c.armT * 0.35   // 暗根 ~0.35x，亮指尖 ~1.15x
  : 1;
```
提高 `DEPTH_PARALLAX` 相关系数上限到 ~1.15，让层次更明显。

### 4. tilt 平滑收敛（可选轻量）
不做逐 cell lerp（开销大），而是把 `intensity` lerp 已经承担的平滑作为整体 gate（现状已有），并对 `angle` 幅度乘 `intensity` 的**平方**：
```
const tiltScale = TILT_MAX_DEG * (Math.PI / 180) * intensity * intensity;
```
让 tilt 在 hover 初期更柔、稳定后达到峰值。

### 5. 常量微调
```
const TILT_MAX_DEG = 8;      // 从 6 提到 8，峰值更可见
const TILT_FALLOFF = 320;    // 从 260 加大，让影响半径覆盖整只手掌
```

### 6. 保持描边同步
outline 描边已在 transform 分支内绘制，无需改动。

## 验证
1. `bun run build` 通过。
2. Playwright 截图三处：光标位于左手指尖上方、右手掌心正下方、两手之间；观察：
   - 附近字符呈明显切向旋转，正上/正下也有倾斜；
   - 指尖字符位移大于手根；
   - 光标进/出时无跳变。

## 预期
- Hover 时字符像围绕光标"扇形摆动"，指尖凸出、手根稳固；
- 远端字符柔和淡出，无生硬圈边；
- hover 初动作柔顺，峰值张力更强，接近源站细节手感。
