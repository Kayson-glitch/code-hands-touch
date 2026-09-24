# 本地开发（Cursor）

## 环境要求

- Node 22+
- Bun 1.3+（包管理与脚本都用 bun，不要混用 npm/yarn）

## 启动

```bash
bun install
bun run dev      # http://localhost:8080
```

## 启动失败：端口被占

dev server 固定用 8080，端口被占时会直接退出而不是换一个端口：

```
error when starting dev server:
Error: Port 8080 is already in use
```

这是刻意的——端口被静默换掉后，转发出去的预览地址看起来和崩溃一模一样。
看到这个报错，要么腾出 8080，要么换个端口跑：

```bash
lsof -ti :8080            # 看是谁占着（macOS / Linux）
lsof -ti :8080 | xargs kill   # 多半是上次没退干净的 dev server

PORT=8090 bun run dev     # 或者直接换端口
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
