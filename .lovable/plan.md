## 目标
仅将 ASCII 手部页脚使用的源图替换为用户新上传的机械手图片，其他参数（字体、字号、字距、行高、颜色、ramp、网格等）保持不变。

## 步骤
1. 通过 `lovable-assets create` 将 `/mnt/user-uploads/Optimize_robotic_arm_style_2K_202607151112.jpeg` 上传为 CDN 资源，输出到 `src/assets/hands-pair.png.asset.json`（覆盖现有指针，保持导入路径不变）。
2. 删除旧的 `src/assets/hands-pair.png.asset.json` 对应的 CDN 对象（先 `lovable-assets delete` 再覆盖），避免孤儿资源。
3. 不修改 `src/components/AsciiHandsFooter.tsx` 任何代码。

## 验证
- 预览页脚渲染的是新机械手图片的 ASCII 版本。
- 其余视觉参数无变化。

范围：仅资源替换，不动组件代码。