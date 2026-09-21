# 首页最后一屏 CTA：加入滚动驱动 dashboard 图片

## 目标
在首页最后一屏（SiteFooter 的 CTA 区块，浅色背景 + 静态点阵矩阵图）中，参考黑色参考图的排版：上方为现有文案与按钮（**不改**），下方加入用户上传的白色 dashboard 截图；鼠标滚动时图片卡片做 3D 翻转/缩放/位移（ContainerScroll 交互）。

- 背景保持浅色 + 现有静态点阵，**不改成黑色**（黑色图仅参考排版）
- 文案（Get started with the / Synergy.AI today）和 Book a Demo 按钮保持不变
- 图片使用上传的 `素材背景.png`，**原图直接使用**（保留 macOS 浏览器边框外观）

## 改动

### 1. 上传图片为 CDN 资产
- 用 lovable-assets CLI 将 `/mnt/user-uploads/素材背景.png` 上传，生成 `src/assets/ask-synergy-dashboard.png.asset.json`

### 2. 新建 `src/components/ui/container-scroll-animation.tsx`
按用户提供的组件代码复制，做以下适配（本项目不是 Next.js，且没有 framer-motion）：
- `framer-motion` → `motion/react`（项目已安装 motion v12）
- `next/image` → 普通 `<img>`
- 保留 `ContainerScroll` / `Header` / `Card` 三个导出与滚动逻辑：`scrollYProgress` 驱动 rotate(20→0)、scale(1.05→1，移动端 0.7→0.9)、translate(0→-100)
- 卡片样式沿用原组件：圆角 30px、双层边框 `border-[#6C6C6C] bg-[#222222]`、内层浅色圆角容器 + 大阴影 `shadow-[0_0_#0000004d,0_9px_20px_#0000004a,...]`

### 3. 修改 `src/components/SiteFooter.tsx` CTA 区块
- 保留点阵静态背景层、现有标题、RainbowButton
- 在按钮下方加入 `<ContainerScroll>`：titleComponent 传空（文案已在上方），children 为 dashboard 截图 `<img>`
- 卡片用浅色主题微调：边框/外壳改为浅色系（如 `border-[#D8D8DE] bg-[#ECECF1]`）以适配浅色背景，图片 `object-cover object-left-top`
- CTA section 高度从固定 880px 调整为自适应内容（图片卡片约 500–700px 高，移动端缩小），并适当加宽容器至 max-w-5xl 以展示图片

## 验证
- Playwright 截图：滚动到最后一屏，确认点阵背景、文案按钮不变，图片卡片初始带 3D 倾角、继续滚动后逐渐放平归位
- 检查控制台无报错，移动端尺寸正常

## 技术说明
- 依赖：无新增（motion 已装）；不安装 framer-motion
- 组件放在 `src/components/ui/`（shadcn 约定目录）
