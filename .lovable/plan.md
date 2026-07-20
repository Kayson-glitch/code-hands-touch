## 目标
点击单只手 → 以点击点为圆心，马赛克区域丝滑扩散并"锁定"覆盖整只手；再次点击同一只手 → 丝滑收回。两只手独立控制。

## 交互
- 命中判断：点击画布，根据 `x < width/2` 判定人手（left）或机械手（right）。仅当该侧手部已完成生长动画后可点击。
- 状态：`lockState = { left: { active, originX, originY, progress }, right: {...} }`；`progress` 0→1 或 1→0 补间。
- 缓动：`easeInOutCubic`，450ms 展开 / 350ms 收回，动画由 `rAF` 驱动（不阻塞 hover）。
- 悬停禁用：某侧 `active=true` 时，该侧不再响应 hover reveal（保留另一侧 hover）。

## 视觉
- 复用现有 mosaic + ASCII 过渡管线。新增每侧一个"锁定 disc"：
  - 圆心 = 点击点（跟随 canvas 坐标）
  - 半径 = `lerp(0, R_LOCK, easedProgress)`，`R_LOCK` ≈ 覆盖单手所需最大距离（基于该侧所有 cell 到点击点的最大欧氏距离，resample 时预算并缓存）
  - 边缘沿用 `GOOEY_NOISE` + 手臂方向噪声，保持不规则近圆形观感
- 侧掩码：锁定 disc 只作用在与点击同侧的 cell（通过 `c.x` vs 画布中线判定），避免溢出到另一只手
- 与 hover 融合：`gooey = max(hoverGooey, lockGooey[side])`；渲染分支不变，因此速度自适应、字符倾斜、视差、halo 等效果自动继承

## 动效手感
- 展开：`easeInOutCubic`，前半段快速扩散、末段柔和贴边
- 收回：同曲线反向，收回中心保留最后一点残影（progress<0.05 时才完全清除）
- 光标离开/移入不影响锁定状态

## 文件
仅修改 `src/components/AsciiHandsFooter.tsx`：
- 新增 `lockRef`（双侧状态）与 `onPointerDown` 处理
- 在主渲染循环里合成 `lockGooey`
- resample 时预计算每侧最大半径

## 不改动
- 图片资源、颜色、字符集、生长动画、hover disc 尺寸/噪声、mosaic 参数