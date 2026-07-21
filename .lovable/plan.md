## 目标
用上传的视频替换开屏球体，视频播放结束（最后一帧）自动触发原来的全屏液态扩散，其他流程与视觉不变。

## 方案

1. **上传视频到 CDN**
   - 用 `lovable-assets` 将 `kling_20260721_...mp4` 上传，生成 `src/assets/intro-hands.mp4.asset.json` 指针。
   - 视频规格：1916×1080，24fps，约 4.04s。

2. **新增 `src/components/IntroVideo.tsx`**
   - 全屏居中播放的 `<video>`，`autoPlay muted playsInline`，禁止循环。
   - `object-fit: contain`，背景与当前 orb 阶段一致（`#EFE7DA`）。
   - `onClick` 保留（可选跳过），主要监听 `onEnded` 触发扩散。
   - 为了拿到"最后一帧起爆"的精确时机：优先用 `onEnded`；同时监听 `timeupdate`，当 `currentTime >= duration - 0.05` 时也触发（保底，防止某些浏览器不触发 `ended`）。
   - 用 ref 保证 `onBurstStart` 只被调用一次。
   - 扩散起点 origin 固定为屏幕中心 `[0.5, 0.5]`（原来是球体点击点，视频没有点击点，用中心最自然）。

3. **改 `src/components/AsciiHandsFooter.tsx`**
   - `stage === "orb"` 时渲染 `<IntroVideo />` 代替 `<LiquidMetalOrb />`。
   - 视频 `onEnded` → 走原来的 `orb-burst` 流程（挂载 `LiquidBurst`，`origin=[0.5,0.5]`），后续 `onCovered` / `onFaded` → `hands` 阶段不变。
   - 删除 orb 的 `exiting` "charge" 过渡（视频结束即扩散，不需要收束阶段）。
   - `LiquidMetalOrb` 组件文件保留但不再引用（不删，方便回退）。

4. **不改动的部分**
   - `LiquidBurst.tsx`（2.6s 扩散、边缘、颜色）保持现状。
   - hands 阶段的入场、ASCII、hover、点击马赛克逻辑全部不变。
   - 背景色切换时机（`onCovered` 切黑）不变。

## 技术备注
- 视频需要 `muted` 才能在浏览器自动播放。
- 若用户浏览器阻止 autoplay，退回：显示视频首帧 + 一个透明覆盖层，点击任意处开始播放。
- 视频文件 ~2.9MB，通过 CDN 提供，首屏加载可接受；用 `preload="auto"` 让扩散触发时不卡顿。
