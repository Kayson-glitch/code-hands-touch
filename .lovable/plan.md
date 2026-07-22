## 目标
让导航栏中间菜单和右侧按钮跟随背景色（黑/白）反相，与 logo 的适配逻辑保持一致。

## 当前问题
- 中间菜单和「Log In」文本已经用 `fg/subtle` 跟随主题，OK。
- 「Book a Demo」按钮固定为 `bg-white text-black`：在浅色背景（视频阶段）下白底白 nav 融为一体、几乎不可见；深色背景下反而正常。需要反相。

## 修改
`src/components/SiteNav.tsx`：
- 「Book a Demo」按钮根据 `isDark` 切换：
  - dark 背景 → `bg-white text-black`（保持现状）
  - light 背景 → `bg-black text-white`
- 「Log In」的 hover 用条件类名代替 `hover:${fg}`（Tailwind 不支持动态拼接 hover 前缀，当前 hover 其实没生效），改成 `hover:text-black` / `hover:text-white`。
- Chevron 已用 `currentColor`，随 `fg` 自动反相，无需改动。

不改动其他文件、不改布局尺寸、不改 logo 逻辑。
