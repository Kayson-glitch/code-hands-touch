# 第一屏进入交互：末帧幽灵手部 + Scroll 提示

## 目标

进入网页时，第一屏不是空白，而是先显示「UI 动画视频最后一帧」的半调手部，整体压到 10% 透明度作为幽灵预览；画面中央显示 Scroll 滚动提示。用户开始滚动后，幽灵手部与提示一起较慢地渐隐，随后接回现有方案（滚轮驱动 49 帧播放 → 末帧停留 → 释放页面滚动）。

## 交互时序

```text
阶段 0  进入页面
  幽灵层：末帧半调手部，opacity 0.10（缓慢淡入 ~800ms）
  中央：Scroll 提示（现有 ScrollHint 样式）
  主画布：第 1 帧（空白）

阶段 1  首次滚动意图（wheel / touchmove / 方向键）
  幽灵层 opacity 0.10 → 0，时长 ~1200ms，ease-out
  Scroll 提示同步淡出
  同时开始现有滚轮驱动帧播放

阶段 2  之后完全按现有逻辑
  49 帧滚动播放 → HOLD_FRAMES 末帧停留 → 页面滚动
```

## 实现方式

### 幽灵手部用图片还是画布？

不新增图片资源。已有的 `hands-frames.webp` 雪碧图里就含最后一帧，直接用现有的半调渲染管线，在一个独立的 `<canvas>` 上把最后一帧渲染一次（静态、只画一次，不进动画循环），叠一层 `opacity: 0.1`。这样风格与正式手部 100% 一致（同样的点阵、墨色、方块化逻辑），也避免多一份素材和风格漂移。

### 涉及文件

- `src/components/HalftoneHandsFooter.tsx`
  - 新增 `ghostCanvasRef`，在雪碧图加载完成后用现有 `drawHalftone` 逻辑渲染 `FRAME_COUNT - 1` 帧一次（尺寸/DPR 与主画布一致，随 resize 重绘）。
  - 幽灵层样式：`position: absolute; inset: 0; zIndex: 9; pointerEvents: none; opacity: ghostOn ? 0.1 : 0; transition: opacity 1200ms cubic-bezier(0.4,0,0.2,1)`；挂载后下一帧置为 `0.1` 形成淡入。
  - 新增 `scrolled` 状态：`wheel` / `touchmove` / 方向键首次触发时置 true（与现有 `consume()` 共用监听，不改劫持逻辑），用于同时关闭幽灵层与提示。
  - 幽灵层仅在 `stage === "hands"` 且未滚动过时存在；`prefers-reduced-motion` 下直接不显示幽灵层与提示。
- `src/components/ScrollHint.tsx`：不改样式，仅把淡出时长与幽灵层对齐（640ms → 1200ms），并接受外部 `visible` 控制。
- `src/routes/index.tsx`：在第一屏固定层中挂载 `ScrollHint`（当前未挂载），置于 Hero 文案之上、Chat Dock 之下。

## 不改动的部分

滚轮劫持与帧播放、`HOLD_FRAMES` 末帧停留、hover 流体墨迹、圆点透明度呼吸、视差、导航栏、Hero 文案、底部输入条、开场动画封存开关（`INTRO_ENABLED = false`）全部保持原样。

## 验证

Playwright：加载后截图确认幽灵手部（很淡）与中央 Scroll 提示同时可见；模拟一次 wheel 后延时 1.4s 再截图，确认两者均已消失且帧播放已开始、`window.scrollY` 仍为 0。
