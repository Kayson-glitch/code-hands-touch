## 目标

1. 大屏（>1440px、2K/4K）下字符手偏小、居中留白过大 —— 让手部尺寸与视口一起放大。
2. 全局性能优化：减少每帧无谓工作、避免 DPR 过采样、去掉不必要的定时器/监听、复用样式对象。

不改交互、动效曲线、颜色、burst 逻辑。

---

## 一、尺寸适配（`src/hooks/useHeroLayout.ts` + `src/components/AsciiHandsFooter.tsx`）

**问题**：`HANDS_VISUAL_MAX_W = 1440` 硬上限；`handsHeight = 51vh` 在超宽屏下比例不匹配；`CELL_W/H = 10` 固定 CSS px，4K 屏上字符物理尺寸偏小。

**方案**：
- `useHeroLayout` 新增一档 `WIDE`（w ≥ 1600）和 `ULTRA`（w ≥ 2000）：
  - WIDE：`handsTop` 上调、`handsHeight` 提到 ~55vh、`titleFontSize` 56、`titlePaddingTop` 20vh
  - ULTRA：`handsHeight` ~58vh、`titleFontSize` 64
  - 返回值扩展 `handsMaxWidth`（number）与 `cellSize`（number, 10/12/14）
- `AsciiHandsFooter`：
  - `HANDS_VISUAL_MAX_W` 改为 `layout.handsMaxWidth`（1440 / 1720 / 2000）
  - `CELL_W`/`CELL_H`/`FONT_PX` 改为从 `layout.cellSize` 派生（cell=10 → font 8；cell=12 → font 10；cell=14 → font 11），在 `resample`/`draw` 中读取局部常量
  - `sampleImage` 与绘制循环使用这些局部值，保证网格间距在大屏上仍成比例
- `getHandsVisualRect` 用 `layout.handsMaxWidth` 而非模块常量

---

## 二、全局性能优化

**A. `AsciiHandsFooter.tsx`**
1. **DPR 上限 2**：`canvas.width = floor(w * min(dpr, 2))`，4K 屏 dpr=2/3 时像素数减半，最大瓶颈。
2. **Font 字符串缓存**：每帧只在 `layout` 变化时重建 `ctx.font`，不在 draw 里拼字符串。
3. **cell 循环内小优化**：把 `HR/HG/HB`、`armDx/Dy` 等常量提到 useEffect 顶层；`glyphAt` 内联；避免 `template string` 构造颜色 —— 用预分配的字符串缓冲或 `ctx.fillStyle` 只在真正变化时赋值（同一 cellAlpha/residueAlpha 时不重复 set）。
4. **`ctx.save/restore` 只在 `useTransform` 分支使用**（已是）—— 保留。
5. **`mousemove` 节流**：合并到 RAF，采样 `mouseRef` 时用最新事件值即可（已经这样），去掉 `mousespeed` 里每次 event 的 EMA 更新 → 改在 draw 里按 dt 更新。
6. **`ResizeObserver` debounce 80ms**：避免拖拽窗口时反复 `resample`（重算 grid 是最贵操作）。

**B. `IntroVideo.tsx`**
1. THREE renderer `setPixelRatio(min(dpr, 1.5))`（shader fill-rate 是主要开销）。
2. `PROGRESS_NOTIFY_EPSILON` 已在 —— 确认 `onProgress` 回调没在父组件触发 state 更新（当前 `handleIntroProgress` 是空函数 ✓，无需改）。
3. RAF loop 内检查 `document.hidden`：隐藏时跳过 render（保留状态推进），减少后台 GPU 占用。
4. `uTime` 已改为绑定 progress ✓。

**C. `index.tsx` / 其他**
- `IntroPreloader` 结束后立即卸载 ✓。确认 `AsciiHandsFooter` 在视频 stage 时 canvas RAF 也可以短路（`stage === "orb"` 时跳过 draw 主体）以节约首屏 CPU。
- `HeroCopy` 的 `app-bg-change` listener OK，无需改。

**D. 通用**
- `passive: true` 已用于 wheel/touch。
- 移除 debug 面板在 production 的挂载（保留 `?debug=1` 门控 —— 已在 `index.tsx`，检查 `IntroVideo` 是否强制显示；当前 `BurnDebugPanel` 默认可见，改为仅 `debug === true` 才 mount）。

---

## 三、验收

- 1440 / 1920 / 2560 / 3200 宽度下截图：手部宽度分别 ≈ 1440 / 1720 / 2000 / 2000px，视觉不再"漂在正中一小块"。
- Chrome Performance 录制一次首屏 3s：主线程 scripting 时间较基线下降；4K 下 canvas 位图不再是 ~50MP。
- 交互（hover/click/lock/burst/滚动）行为无回归。
- Build 通过。

---

## 技术细节

```text
useHeroLayout 新档:
  WIDE  (w>=1600, h>760): handsHeight 55vh, cellSize 12, handsMaxWidth 1720, titleFontSize 56
  ULTRA (w>=2000):        handsHeight 58vh, cellSize 14, handsMaxWidth 2000, titleFontSize 64

AsciiHandsFooter:
  const cell = layout.cellSize; const font = Math.round(cell*0.8);
  DPR = Math.min(window.devicePixelRatio||1, 2)
  RO debounce 80ms → resample

IntroVideo:
  renderer.setPixelRatio(Math.min(dpr, 1.5))
  if (document.hidden) skip render this frame
  BurnDebugPanel: mount only when props.debug === true
```
