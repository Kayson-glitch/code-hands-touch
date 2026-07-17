目标：将当前 `hands-pair.png` 的 Lovable 资源替换为用户上传的 `Frame_1321320132.png`，其他效果（ASCII 渲染、视差、倾斜、Gooey 等）全部保持不变。

改动范围：
1. 通过 `lovable-assets create` 从 `/mnt/user-uploads/Frame_1321320132.png` 创建新的 CDN 资源指针。
2. 替换 `src/assets/hands-pair.png.asset.json` 的内容，使其指向新上传的图片，但保留组件中 `import handsPairAsset from "@/assets/hands-pair.png.asset.json";` 的导入路径不变。
3. 不修改 `src/components/AsciiHandsFooter.tsx` 中的任何逻辑、参数或视觉常量。

验证：
- 运行 `bun run build` 通过。
- 预览页中显示的图片变更为上传的机器人与人类手图片，ASCII 覆盖效果、悬停视差、倾斜等效果保持原样。

备注：上传图片中的手部为真实人手与金属机器人手，构图与当前“Creation of Adam”主题一致，因此替换后只需沿用同一套 ASCII 处理逻辑。