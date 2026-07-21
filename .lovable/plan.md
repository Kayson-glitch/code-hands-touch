## 目标
在开屏视频动画前加一个真实字节级预加载进度（百分比数字），加载完再丝滑进入后续流程。同时让整段视频进入交互前就已经完整缓存，减轻滚轮 seek 时的卡顿。

## 交互
1. 页面挂载 → 全屏黑底，居中显示 `0%`（Montserrat 500，字号 48/56，纯白）。**此时不渲染导航栏 / Hero / 手部 / FinChat**。
2. 后台 `fetch(videoAsset.url)`，用 `Content-Length` + streamed 字节累加得到真实进度；每次字节回调都直接更新百分比（跟随网速跳动，用户选 A）。
3. fetch 完成 → 把 `Blob` 转 `URL.createObjectURL(blob)`；等 `<video>` 的 `loadeddata`（首帧就绪）后：
   - 百分比数字 opacity → 0，用 250ms `ease-out`；
   - 卸载 preloader，挂载 `SiteNav / HeroCopy / AsciiHandsFooter / FinChatDock`，容器从 opacity 0 → 1，350ms `ease-out`。
4. 后续滚轮控制流程完全保持现状。
5. Fallback：`fetch` 失败或没有 `Content-Length` → 隐藏百分比、直接进入下一步（不阻塞）。

## 代码改动
- **新增 `src/components/IntroPreloader.tsx`**
  - Props: `{ src: string; onReady: (objectUrl: string, videoW: number, videoH: number) => void; onFail: () => void }`
  - 内部：streamed fetch → 每 chunk 更新 `useState<number>` 百分比；结束后 `createObjectURL(blob)`，创建一个隐藏 `<video>` 预热到 `loadeddata`，再调用 `onReady`。
  - UI：`position: fixed; inset: 0; background: #000; z-index: 100`；居中大号数字 `{Math.floor(pct)}%`。
- **`src/routes/index.tsx`**
  - `const [videoSrc, setVideoSrc] = useState<string | null>(null)`。
  - `videoSrc === null` → 只渲染 `<IntroPreloader src={videoAsset.url} onReady={(url) => setVideoSrc(url)} onFail={() => setVideoSrc(videoAsset.url)} />`。
  - 否则渲染现有 `AsciiHandsFooter/SiteNav/HeroCopy/FinChatDock`，并把 `videoSrc` 传给 `AsciiHandsFooter`。外层加一个 `opacity` 淡入。
- **`src/components/AsciiHandsFooter.tsx`**
  - 新增可选 prop `videoSrc?: string`，透传给 `IntroVideo`。
- **`src/components/IntroVideo.tsx`**
  - 新增可选 prop `src?: string`，`<video src={src ?? videoAsset.url} />`。其余滚轮、shader、首帧解码逻辑不动。
- **`src/components/SiteNav.tsx`**：不动（在 preloader 阶段本就没挂载）。
- ObjectURL 泄漏：`IntroVideo` 的 `useEffect` 清理不撤销 objectURL（因为一路由要用到最后）；`index.tsx` 里 `useEffect` return 时 `URL.revokeObjectURL(videoSrc)`。

## 验证
- 刷新页面：先看到黑底 `0% → ... → 100%`（数字随网速跳动，无平滑），随后数字淡出、导航栏和视频首帧一起淡入，可立即滚动。
- 滚轮 seek 明显更跟手（因为视频已全量缓存）。
- 断网/CORS 场景 fallback：直接进入原有流程，不卡在 preloader。
