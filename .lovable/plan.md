## 目标

恢复实时调参面板 `BurnDebugPanel`（之前接入过，现在只在 `?debug=1` 时显示，希望能直接看到）。

## 改动

`src/components/IntroVideo.tsx`
- 让面板默认渲染：把渲染条件 `debugEnabled` 改成常显，`debug` prop 保留但不再决定可见性。
- 保留面板的 "Jump to Burst" 和 "Finish" 按钮；现在扩散已经是滚轮驱动、可回滚，这两个按钮仍能用来快速跳到扩散段或强制进入下一屏。
- 移除已废弃的 `debugRef` 分支残留（burn 现在始终跟随 `burstProgress`，无需再判 debug）。

不改动其它组件、路由、样式。

## 确认

需要我在生产发布时也保留这个面板吗？默认按"始终显示"来做；如果只想开发时看到，请告诉我我改成只在带 `?debug=1` 时显示。
