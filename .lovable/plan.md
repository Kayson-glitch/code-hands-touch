将当前 hover 揭示形状（Shape A：不规则墨迹圆）调整为更明显的「不规则但近圆形」轮廓。

## 目标
- 整体 footprint 仍保持约 80px 直径的圆形
- 边缘呈现有机、不规则的破碎/ blob 感，而不是规则的圆或椭圆
- 不引入新的形状选项，而是直接修改默认 Shape A 的表现

## 改动方案
1. 在 `computeReveal` 的 Shape A 分支中，增加一个基于角度的半径形变层：
   - 使用低频噪声对半径进行 ±15% 的调制
   - 叠加中频 hash 造成细碎的边缘缺口
   - 保持 `GOOEY_RADIUS_UV` 基础半径不变（80px 直径）
2. 将 Shape A 的定向噪声强度从 `ARM_ALIGN_STRENGTH` 暂时降低，让破碎边缘更均匀，不沿手臂拉伸；其他形状（B/C/D）保持原有定向逻辑。
3. 调整 `GOOEY_NOISE` 或 Shape A 专用噪声系数，使边缘不规则但不扩展面积过大。

## 交付
- 修改 `src/components/AsciiHandsFooter.tsx` 中 shape A 的距离/噪声计算
- 保留调试面板、子网格、流动动画、加载动画等所有其他效果
- 修改后通过预览截图确认形状