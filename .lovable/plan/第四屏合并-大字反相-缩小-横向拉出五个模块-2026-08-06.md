# 第四屏合并：大字反相 → 缩小 → 横向拉出五个模块

取消独立的「第五屏」。第四屏（Artemis delivers certainty）变成一个连续的钉住区段，一次滚动走完三个阶段，标题自己就是后面模块的标题。

## 交互分段（同一个 sticky 舞台，滚动进度 0→1）

```text
阶段 A  0.00–0.30   浅底 → 黑底自下而上抹上来（保持现有 clip-path 抹除）
阶段 B  0.30–0.45   全黑后，大字随滚动缩小到 60%（即缩小 40%），并移到左上角定位
阶段 C  0.45–1.00   五个图文模块从右侧横向拉出，手感与第三屏一致
```

- 阶段 A 完成（全黑）之前不做缩放；阶段 B 期间不动横向位移；阶段 C 期间标题保持缩小后的状态钉在左侧，随轨道一起向左移出。
- 缩放用 `transform: scale()` + `transform-origin: left top`，配合 `easeOutCubic`，不改字号，避免重排。
- 轨道长度：现在的黑屏轨道 260vh + 缩小段约 60vh + 五屏横向 500vh，合成一个 wrapper 高度，进度按上面的分段重新映射。

## 圆点矩阵锁住

进入黑屏后圆点不再随页面滚动：把黑色层里的圆点网格改成 `position: fixed`（左右仍留 100px 边距），只在该区段处于视口内时渲染，离开时卸载。这样整个黑屏阶段（含缩小与横向拉出）圆点完全静止。

## 结构调整

- `FeatureGallerySection` 不再作为独立 section 出现在页面里；它的五个面板与轨道逻辑并入第四屏的 sticky 舞台（作为内部组件复用，删除它自己的 wrapper／dots／intro 标题）。
- 删除 `artemis-gallery__intro`（EXPLORE / AI SUPPORT），标题由 `{Artemis} delivers certainty` 承担。
- `src/routes/index.tsx` 移除 `<FeatureGallerySection />`，只保留 `<ClosingSection />`。

## 技术备注

- 改动文件：`src/components/ClosingSection.tsx`（合并三阶段进度与舞台）、`src/components/FeatureGallerySection.tsx`（改为受控的面板轨道子组件）、`src/styles.css`（缩放原点、fixed 圆点、去掉 intro 样式）、`src/routes/index.tsx`。
- 进度依旧订阅 Lenis 的 scroll 事件（与第三屏同帧），保持一致手感。
- 移动端与 `prefers-reduced-motion`：不钉住，大字正常显示，五个模块纵向堆叠，圆点恢复 absolute。
- 完成后用 Playwright 在 1440×900 分段截图（进度 0/0.3/0.45/0.7/1）验证：反相完整、缩小不抖、面板不被裁切、圆点静止、导航与底部对话框深色态切换正确。
