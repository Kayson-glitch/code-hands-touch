## 目标
用你上传的两张 logo 替换现在的 `invert` 方案，避免黑底下颜色失真。

## 实施步骤
1. 通过 `lovable-assets` 从 `/mnt/user-uploads/Container-1.png`（深色版，用于浅底）和 `/mnt/user-uploads/Container-2.png`（白色版，用于黑底）分别生成 asset 指针：
   - `src/assets/synergy-logo-light.png.asset.json`（Container-1）
   - `src/assets/synergy-logo-dark.png.asset.json`（Container-2）
2. 修改 `src/components/SiteNav.tsx`：
   - 导入两个 asset。
   - 根据 `isDark` 切换 `src`：黑底用 dark 版，浅底用 light 版。
   - 移除 `filter: invert(1) hue-rotate(180deg)`，保持原始颜色。
   - 保留 `height: 28` 及现有布局不变。
3. 不改动其他文件与效果。