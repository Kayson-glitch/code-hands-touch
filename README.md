# FakeHunter.AI 官网

FakeHunter 企业官网：极简深色取证风格，主色 `#E1F056`，正文字体 Red Hat Display，数据数字用 Smooch Sans。

## 页面

| 路由 | 内容 |
| --- | --- |
| `/` | 企业首页：双线判定首屏、半屏 slogan、技术、精度、性能、客户评价、收尾 CTA |
| `/solution` | 产品方案详情：检测流程、三条检测线、伪造与真实对比、吞吐、定价 |
| `/demo` | 产品演示：交互式检测器 |

## 本地开发

需要 Node 22+ 和 Bun 1.3+（包管理和脚本都用 bun）。

```bash
bun install
bun run dev        # http://localhost:8080
bun run build      # 生产构建
bun run preview    # 预览构建产物
bun run lint
```

项目没有数据库、登录和后端数据，不需要环境变量。

## 目录

- `src/routes/`：页面路由（TanStack Router 文件路由），`routeTree.gen.ts` 由构建自动生成。
- `src/fakehunter/`：站点本体。
  - `content.ts`、`content.home.ts`：全部文案，改文案只改这两个文件。
  - `HomeSite.tsx`、`SolutionSite.tsx`、`DemoSite.tsx`：三个页面的组装。
  - `sections/`：各章节；`components/`：导航、页脚、首屏判定场等组件。
- `src/styles/fakehunter.css`：设计 token（颜色、字重、缓动）和通用样式类，全部收在 `[data-fh]` 作用域下。

技术栈：TanStack Start v1 + Vite + Tailwind v4 + React 19，默认构建目标为 Cloudflare Worker。
