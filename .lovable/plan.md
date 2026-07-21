## 目标
开屏视频始终占满整个视口，视频本身不变形不裁剪，四周空白用同一视频放大 + 模糊后作为背景填充。

## 改动
仅修改 `src/components/IntroVideo.tsx`：

1. 外层容器 `position: absolute; inset: 0; overflow: hidden; background: #000`。
2. 背景层：一个 `<video>`（复用同一 src，`muted playsInline autoPlay`，与前景同步播放）
   - `object-fit: cover`，`width/height: 100%`
   - `filter: blur(40px) saturate(1.1)`，`transform: scale(1.15)`（避免模糊边缘露出）
   - `aria-hidden`，不参与 `onEnded` 触发
3. 前景层：现有 `<video>` 保持 `object-fit: contain`，完整显示、不变形不裁剪；仍然是 `onEnded` / `timeupdate` 触发扩散的唯一来源。
4. 两个 video 同一时刻 `play()`，因为都是 muted + 同源，帧基本同步；即便有 1–2 帧偏差，模糊背景层看不出差异。

## 不改动
- `AsciiHandsFooter.tsx` 状态机、`LiquidBurst`、hands 阶段全部保持现状。
- 视频资源、扩散触发时机、背景色切换时机不变。
