## 目标
让紫色液态金属球（LiquidMetalOrb）在 footer 中稳定显示，并叠加在所有元素（背景大字、ASCII canvas）之上。

## 排查
- Orb 容器已用 `absolute` 定位，但和 canvas 处于同一堆叠上下文、无显式 `z-index`；如果之后有任何元素或 canvas 覆盖，就看不到球体。
- `LiquidMetalOrb` 里的 R3F `<Canvas>` 在 TanStack Start SSR 阶段可能报错或输出空节点，客户端 hydrate 后也可能没被正确挂载，导致预览为空。
- WebGL 判定逻辑 (`!("WebGLRenderingContext" in window)`) 只在无 WebGL 时返回 null，本身没问题，但组件未做客户端保护。

## 修改方案（只动展示层，不改 hover/click/流动等既有效果）

1. **`src/components/AsciiHandsFooter.tsx`**
   - 给球体容器补一个最高层级：
     - 追加 `z-50`（或 `style={{ zIndex: 50 }}`），保证盖过 wordmark 和 ASCII canvas。
   - 用 `useHydrated()` 或本地 `mounted` state 包一层，只有客户端挂载后才渲染 `<LiquidMetalOrb />`，避免 SSR 空白。

2. **`src/components/LiquidMetalOrb.tsx`**
   - 给 `<Canvas>` 加 `style={{ width: "100%", height: "100%", pointerEvents: "none" }}`，确保在 200×200 容器中撑满。
   - 移除多余的 WebGL 探测（交给客户端渲染保护）；如需保留可只在 `useEffect` 内判定。

## 验证
- 保存后在预览中央应能看到 200px 的紫色金属球持续旋转/形变。
- Hover 手部与点击锁定马赛克仍正常（容器 `pointer-events-none`，球体不拦截交互）。
- Console 无 R3F/SSR 报错。
