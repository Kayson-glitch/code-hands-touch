## 目标
按参考图 1:1 复刻首屏布局比例，并移除底部大字 "Synergy.AI"。

## 参考图布局分析（1920 基准）
- 导航栏：顶部 ~54px 高度区域，logo 左侧 ~200px，中部菜单居中，右侧 Log In + Book a Demo
- 标题区域：垂直位置约 27%–43%（标题 + 副标题 + 按钮整体在上半屏偏上）
  - 标题距顶 ~27vh
  - 副标题距标题 ~24px
  - Book a Demo 按钮距副标题 ~64px
- 手部 ASCII：从约 55vh 开始，延伸到底部，手指尖大致在 55vh 位置，两只手左右分布顶到屏幕左右边缘
- 底部：无大字水印，纯黑背景延伸到底

## 修改项

### 1. `src/components/AsciiHandsFooter.tsx`
- 删除底部 "Synergy.AI" 大字水印 DOM 与相关样式
- 手部 canvas 定位调整：`top: 55vh`，`height: 45vh`，`bottom: 0`，让手部占据下半屏并延伸至底边
- 移除内部对水印的间距预留

### 2. `src/components/HeroCopy.tsx`
- `paddingTop` 从 `8vh` 调整为 `24vh`，让标题落在参考图的 ~27vh 位置
- 保持标题 / 副标题 / 按钮的内部间距（副标题上距 24px，按钮上距 64px）

### 3. `src/routes/index.tsx`
- 无需结构变更，仅确认层级顺序

## 不改动
- 导航栏 SiteNav（已符合参考）
- 字体、颜色、按钮样式
- 手部动画、hover、mosaic、点击、intro video 等全部交互逻辑
- 底部对话框 FinChatDock
