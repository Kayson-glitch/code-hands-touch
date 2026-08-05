# 暂时关闭「开场动画」并无损封存

目标：首屏加载后直接进入静态手部 + 文案状态，跳过开场视频与色散爆闪；所有开场动画代码与素材完整保留，之后只要说「开场动画」即可一键恢复。

## 做法

用一个开关常量控制开场动画，不删除任何组件文件。

新增 `src/components/intro/introConfig.ts`：

```ts
// 开场动画总开关。false = 封存（跳过开场视频/爆闪）；true = 恢复。
export const INTRO_ENABLED = false;
```

### 关闭时的行为

- `src/routes/index.tsx`：不再挂载 `IntroPreloader`，直接以 `videoSrc = null / handoffVideo = null` 进入正式页面，首屏立即淡入。
- `src/components/HalftoneHandsFooter.tsx`：初始 `stage` 直接为 `"hands"`，`orbMounted = false`（不挂载 `IntroVideo`），`bgDark = true`；挂载时立即派发 `app-bg-change: dark` 与 `app-nav-visibility: visible`，让导航栏、Hero 文案、底部 Chat Dock 正常显示。
- 手部滚轮驱动、hover 流体墨迹、透明度呼吸、视差等现有效果完全不变。

### 保持不变（封存内容）

- `IntroVideo.tsx`、`IntroPreloader.tsx`、`AuroraIntro.tsx`、`BurnDebugPanel.tsx` 文件内容不改动、不删除。
- `src/assets/intro-hands.mp4.asset.json` 保留。
- 相关 import 保留在原位，仅由开关决定是否渲染，因此恢复时无需重写逻辑。

### 恢复方式

把 `INTRO_ENABLED` 改回 `true`，行为与今天完全一致（视频预载 → 播放 → 爆闪 → 交接到手部）。我会把这个开关记入项目记忆，你之后只说「开场动画」我就直接打开。

## 技术要点

- 开关在模块顶层导出为常量，SSR 与客户端一致，不会造成 hydration 不一致。
- 关闭路径下不请求开场视频资源，首屏更快。
- Hero 文案原本依赖 `app-bg-change: dark` 事件（含 640ms 延迟）才显现，关闭开场动画后该事件在挂载时立即派发，文案照常做一次淡入。
