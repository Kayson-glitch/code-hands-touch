## 目标

将截图红圈处（"Book a Demo" 按钮底部到 ASCII 手部区域顶部）的垂直间距略微缩小，使首屏整体更紧凑。

## 当前布局

- `HeroCopy` 标题区通过 `paddingTop` 下推，按钮再带 `mt-8`（32px）额外间距。
- 手部画布通过 `useHeroLayout.handsTop` 定位，桌面端为 `calc(48vh - 8px)`。
- 间距 = `handsTop` 起始位置 - 按钮底部位置，主要由 `titlePaddingTop` 和 `handsTop` 共同决定。

## 修改方案

1. 统一小幅降低 `titlePaddingTop`，让标题/按钮整体下移约 2vh：
   - Desktop: `20vh` → `18vh`
   - Short: `16vh` → `14vh`
   - Tablet: `18vh` → `16vh`
   - Mobile: `12vh` → `10vh`

2. 同步小幅上提手部画布起始位置，进一步收紧按钮与手之间的空隙：
   - Desktop: `calc(48vh - 8px)` → `calc(46vh - 8px)`
   - Short: `44vh` → `42vh`
   - Tablet: `46vh` → `44vh`
   - Mobile: `42vh` → `40vh`

3. 保持 `handsHeight` 不变，手部区域大小和内部 hover/ASCII 效果不受影响。

## 涉及文件

- `src/hooks/useHeroLayout.ts`：调整 `titlePaddingTop` 与 `handsTop` 的四个断点值。

## 验证方式

- 保存后在当前预览视口（1327×924）查看按钮与手部的间距是否明显收紧但仍保持呼吸感。
- 快速切换桌面/平板/移动视图确认各断点未出现重叠或过度拥挤。