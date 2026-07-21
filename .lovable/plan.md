## 目标交互流程
1. **开屏**：黑色背景中央仅显示紫色液态金属球（`LiquidMetalOrb`），持续自转+表面扰动循环。手部 ASCII、wordmark 完全隐藏，且不占用交互。
2. **点击球体**：触发一次"快速扩散消失"动效（~450ms）——球体在原地放大 + 表面 distort 增强 + 透明度归零，同时触发轻微径向白光/紫光冲击（可选：CSS radial-gradient 一次性 pulse），随后球体从 DOM 卸载。
3. **手部入场**：球体消失的最后阶段（重叠 ~150ms）触发既有的手臂生长动画（`startIntroAnimation`），wordmark 与 ASCII 手正常出现，之后 hover / click 交互恢复到当前行为。
4. **不可逆**：一旦手部出现，不再回到球体（本轮不做返回逻辑）。

## 阶段状态机
`stage: "orb" | "orb-exit" | "hands"`
- `orb`：只渲染球体容器，球体 `pointer-events: auto` 接收点击；ASCII canvas / wordmark 隐藏（`opacity:0` + `pointer-events:none`），IntersectionObserver 不启动生长。
- `orb-exit`：进入 450ms 退出动画，球体禁用二次点击。到 300ms 时切到 `hands` 并调用手臂生长。
- `hands`：卸载球体，恢复现在的全部交互（hover 破碎、点击锁定马赛克）。

## 技术改动
- **`LiquidMetalOrb.tsx`**：
  - 接受 `onClick`、`exiting: boolean` props。
  - 容器改为 `pointer-events: auto` 并绑定点击。
  - `exiting=true` 时用 `useFrame` 线性驱动 `scale` 从 1 → 2.4、`distort` 从 0.45 → 1.1、材质 `opacity` 从 1 → 0（材质加 `transparent`）。
- **`AsciiHandsFooter.tsx`**：
  - 新增 `stage` state，初始 `"orb"`。
  - 抽出/暴露 `startIntroAnimation` 触发口，改为由 `stage` 变 `"hands"` 时调用，而不是 IntersectionObserver。
  - `stage !== "hands"` 时：ASCII canvas 与 wordmark 容器 `opacity: 0`、`pointer-events: none`；`stage === "hands"` 时淡入（150ms）。
  - 球体容器 `pointer-events` 随 stage 切换；`stage === "hands"` 后卸载球体。
  - 处理点击：`orb → orb-exit`，`setTimeout(300ms)` 切 `hands` 并调用生长动画；`setTimeout(450ms)` 卸载球体。

## 验证
- 刷新页面：只看到球体旋转，背景纯黑，无手部/wordmark。
- 点击球体：球体在 ~0.45s 内放大变形淡出；期间 300ms 时手臂开始从两侧生长，2.4s 后停在中央。
- 生长结束后：hover 触发马赛克破碎，单击左右手仍可各自锁定/解锁。
- 不再显示球体，二次点击不复现。
