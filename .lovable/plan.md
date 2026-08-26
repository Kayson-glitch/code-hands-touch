# 导航栏 Logo 回首页太慢：原因与修复

## 原因

导航栏 logo 用的是原生 `<a href="/">`（`src/components/SiteNav.tsx:134`），根布局里也有一个（`src/routes/__root.tsx:65`）。原生链接会让浏览器**整页重新加载**：

1. 丢弃当前已经跑起来的 React 应用，重新走一次服务端渲染请求；
2. 重新下载并执行整个 JS bundle、重新 hydrate；
3. 首页第一屏的重资源要从零再来一遍 —— 手部雪碧图（约 67KB WebP）重新解码，以及首屏挂载的 `intro-hands.mp4`（约 6MB）重新请求；
4. 半调点阵画布要重新初始化、重算网格。

所以从 why-synergy 页点 logo 回首页，感觉像"重开网站"，而不是站内切页。

## 修复

### 1. 换成客户端路由跳转（主因）

- `src/components/SiteNav.tsx`：logo 的 `<a href="/">` 改为 `<Link to="/">`（`@tanstack/react-router` 已在该文件引入了 `useNavigate`，直接补 `Link`）。
- `src/routes/__root.tsx:65`：同样的 `<a href="/">` 一并换成 `<Link to="/">`。

这样点击不再整页刷新，路由在客户端切换，JS/CSS 不用重新下载，切页几乎瞬间完成。

### 2. 预加载首页路由

给 logo 链接加 `preload="intent"`（鼠标悬停即预取首页路由代码与数据），进一步消除点击后的空档。

### 3. 首屏视频不再阻塞首页呈现

首页目前把 6MB 的 `intro-hands.mp4` 挂在第一屏。开场动画开关本就是关闭状态（`INTRO_ENABLED = false`），但视频元素仍会请求资源。改为：视频标签加 `preload="metadata"`，让首屏点阵画面（雪碧图渲染）先出来，视频按需加载，不阻塞第一屏可见内容。

## 不改动的部分

手部半调渲染逻辑、滚轮驱动帧播放、幽灵首帧、各屏滚动交互、导航栏视觉样式、开场动画封存开关全部保持原样。

## 验证

从 `/why-synergy/business-impact` 点 logo 回首页：确认地址栏变为 `/` 且**没有整页刷新**（页面不闪白、网络面板没有新的文档请求），第一屏手部与 Scroll 提示立即可见。
