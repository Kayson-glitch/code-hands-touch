当前问题：标题区域（HeroCopy）与手部 ASCII 画布（AsciiHandsFooter）之间的留白过大，导致首屏视觉重心过于分散。

当前实测状态：
- HeroCopy: paddingTop 为 12vh
- 手部 canvas: top 为 32vh，height 为 56vh
- 底部 Synergy.AI 大字：占 28% 高度并吸底
- 标题—手部视觉间距约 20vh，整体布局偏松散

修改方案：
1. 降低标题区域顶部距离，将 HeroCopy 的 paddingTop 从 12vh 调整到 8vh。
2. 上移手部 canvas，将 top 从 32vh 调整到 28vh，height 保持 56vh 不变（若上移后手部显得过大，可微调为 54vh）。
3. 保持底部 Synergy.AI 大字吸底且高度不变，避免破坏吸底效果。
4. 调整后标题—手部间距约 14vh，标题与手部作为整体仍大致位于视口垂直中心附近。

涉及文件：
- src/components/HeroCopy.tsx
- src/components/AsciiHandsFooter.tsx

验证：在预览中检查首屏，标题、手部、底部大字三段纵向节奏应更紧凑，且手部不遮挡标题。