# 本地开发（Cursor）

## 环境要求

- Node 22+
- Bun 1.3+（包管理与脚本都用 bun，不要混用 npm/yarn）

## 启动

```bash
bun install
bun run dev      # http://localhost:8080
```

## 其他命令

```bash
bun run build      # 生产构建
bun run preview    # 预览构建产物
bun run lint
bun run format
```

## 说明

- 项目无数据库、无登录、无后端数据，不需要任何环境变量或 API key。
- 全部图片 / 视频素材在 `public/media/`，通过 `src/lib/media.ts` 统一引用。
- 技术栈：TanStack Start v1 + Vite + Tailwind v4 + React 19，构建目标 Cloudflare Worker。
