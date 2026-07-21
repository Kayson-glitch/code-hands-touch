## 问题定位

历史版本（你给的 commit）里 canvas 是 `absolute inset-0 h-full w-full`，也就是**全屏画布**；hover 半径用 `GOOEY_RADIUS_UV = 0.048` 基于全屏坐标计算。

现在为了布局把 canvas 改成了手部区域：`width: min(100vw, 1440px)` + `height: 51vh`。但 hover 仍然用同一套 UV/距离计算：

```ts
const minWH = Math.min(canvasW, canvasH)
const aspectX = canvasW / canvasH
const cellUvX = (x / minWH) * aspectX
```

当画布高度只有 51vh 时，`aspectX` 变大，横向距离被放大，hover 视觉区域会被压缩/变小，和历史 commit 不一致。

## 修复方案

保持现在的布局位置和 1440px 默认视觉宽度，但把 hover 计算恢复到历史的“全屏坐标基准”。

### 1. canvas 恢复为全屏绘制层

`src/components/AsciiHandsFooter.tsx`

- canvas class/style 从局部画布改回全屏：`absolute inset-0 h-full w-full`。
- 不再直接把 `top / height / width: min(100vw,1440px)` 写到 canvas 上。

### 2. 新增手部绘制区域 rect

在 render loop 中根据 `layout.handsTop / handsHeight` 计算一个绘制区域：

```ts
visualRect = {
  x: (viewportW - Math.min(viewportW, 1440)) / 2,
  y: resolvedHandsTopPx,
  w: Math.min(viewportW, 1440),
  h: resolvedHandsHeightPx,
}
```

然后：

- 图片采样 / ASCII 网格仍绘制在这个 rect 内。
- 指针命中、点击锁定仍按这个 rect 内的手部位置判断。
- hover disc 距离计算使用全屏 canvas 的 `minWH/aspectX`，恢复历史观感。

### 3. hover 半径恢复历史 UV 公式

- 删除/停用上次新增的 `GOOEY_RADIUS_PX` / `GOOEY_SOFTNESS_PX`。
- 恢复：

```ts
const R = GOOEY_RADIUS_UV * intensity
const S = GOOEY_SOFTNESS_UV * intensity * 0.5
```

这样大小和历史 commit 一致，同时不会因为手部视觉区域高度变化而变小。

## 保持不变

- 当前标题/手部布局比例不改。
- 默认视觉宽度仍为 1440px 居中。
- 悬停马赛克、字符倾斜、视差、点击锁定、intro 视频逻辑不改。

## 验证

- 在当前 1327×922 下 hover，视觉大小应接近你给的历史 preview。
- 1440×900 下 hover 大小应保持一致。
- 1920 宽屏下手部视觉宽度仍锁定 1440px 居中，但 hover 不再变小。