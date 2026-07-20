## 目标
把当前 ASCII 手部效果使用的 `hands-pair.png` 资源替换为用户上传的新图 `Frame_1321320132-2.png`，保持所有代码、颜色、动效、交互参数不变。

## 当前状态
- 组件 `src/components/AsciiHandsFooter.tsx` 通过 `import handsPairAsset from "@/assets/hands-pair.png.asset.json"` 读取 CDN 资源。
- 现有 asset 指向旧图（asset_id: aeabbf83-b4b7-4a8e-8ee0-42ca498cf9c2）。
- 用户上传的新图为黑底、人类手与机械手相向伸出的高对比照片，适合现有 ASCII 采样逻辑。

## 实施步骤
1. 使用 `lovable-assets create` 将 `user-uploads://Frame_1321320132-2.png` 上传为 CDN asset，并输出到 `src/assets/hands-pair.png.asset.json`。
2. 删除旧 asset 指针文件中原内容，写入新 CLI 生成的 JSON（保持文件名 `hands-pair.png.asset.json` 不变）。
3. 不修改 `src/components/AsciiHandsFooter.tsx` 及其任何常量、动效、颜色或交互逻辑。

## 验证
- 运行 `bun run build` 确认构建通过。
- 通过预览查看新的手部剪影是否被正确采样为 ASCII 字符，且原有揭示、视差、流动、描边等效果保持不变。

## 不改动
- 颜色、揭示盘半径/形状、视差强度、字符倾斜、入场生长、流动动效、描边层、代码结构。