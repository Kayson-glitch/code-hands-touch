# 打包 ASCII Hands 交互效果为可移植代码包

## 目标
把当前项目的核心交互效果（ASCII 手部动画 + 鼠标悬浮破碎揭示 + 视差 + 生长入场动画）打包成一份**独立的、可直接复制到其他工作区使用**的代码资产。

## 交付物

在 `/mnt/documents/ascii-hands-package/` 下生成一个完整目录，包含：

```
ascii-hands-package/
├── README.md                      # 使用说明（安装、集成、替换图片）
├── AsciiHandsFooter.tsx           # 主组件（当前 src/components 版本）
├── hands-pair.png                 # 当前使用的手部图片（从 CDN 下载内嵌）
├── route-example.tsx              # TanStack Start 路由示例
├── react-router-example.tsx       # 传统 React 项目示例
└── tuning-notes.md                # 参数调校说明（半径、视差、倾斜等）
```

同时打包成 `ascii-hands-package.zip` 方便下载。

## README.md 内容要点

1. **环境要求**：React 18+、Tailwind（可选，仅用于容器样式）
2. **快速集成（3 步）**：
   - 复制 `AsciiHandsFooter.tsx` 到 `src/components/`
   - 复制 `hands-pair.png` 到 `src/assets/` 并调整 import 路径
   - 在页面中 `<AsciiHandsFooter />` 引用
3. **替换图片**：说明图片要求（黑底、透明或纯色背景、双手对置构图效果最佳）以及只需替换 `hands-pair.png` 即可
4. **可选自定义**：颜色（当前 `#C5A9FF` 淡紫）、鼠标揭示直径（80px）、视差强度（13px）在文件顶部常量区修改
5. **依赖说明**：组件仅依赖 React，无需额外 npm 包

## 技术说明

- 组件已是自包含的：一个 `.tsx` 文件 + 一张图片资产
- 从当前 `src/assets/hands-pair.png.asset.json` 的 CDN URL 下载图片实体文件内嵌到包中
- 保留当前所有调好的参数（80px 揭示、13px 视差、220ms 延时、破碎噪声、arm-aligned 方向、生长入场动画、字符倾斜、边缘描边）
- 提供两个集成示例：TanStack Start（当前项目） + 通用 React（Vite/CRA/Next 均适用）

## 使用方式（用户视角）

打包完成后我会告诉你：
1. 下载 `ascii-hands-package.zip` 的路径
2. 在新工作区如何 3 步集成
3. 如何替换成你自己的图片
