## 目标
把新机械手图片的白色背景去除，得到透明 PNG，替换当前 CDN 资源；不改动组件代码及其他视觉参数。

## 步骤
1. 用 `imagegen--edit_image` 处理 `user-uploads://Optimize_robotic_arm_style_2K_202607151112.jpeg`，`transparent_background=true`，输出到 `/tmp/hands-pair.png`。
2. `lovable-assets delete` 现有 `src/assets/hands-pair.png.asset.json`（旧 jpg 版本）。
3. `lovable-assets create --file /tmp/hands-pair.png --filename hands-pair.png` 生成新指针，覆盖 `src/assets/hands-pair.png.asset.json`。
4. 组件通过 `handsPairAsset.url` 读取，无需改代码。

## 验证
- 页脚 ASCII 采样时背景不再被亮像素填满，机械手轮廓更清晰。
- 其余参数（字体、字号、颜色、ramp、网格）不变。

范围：仅资源替换。