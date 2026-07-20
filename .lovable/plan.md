## 目标
在两只 ASCII 手掌中心位置叠加一个 200px 的液态金属紫色 3D 球体，做循环动画，风格接近 Spline 常见的 blob。不要文字。

## 方案
使用 `react-three-fiber` + `drei` 的 `MeshDistortMaterial` + `Environment`，在 `AsciiHandsFooter` 上层叠加一个绝对定位的透明 Canvas。

### 依赖
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### 组件结构
新建 `src/components/LiquidMetalOrb.tsx`：
- `<Canvas>`：200×200 px，`gl={{ alpha: true }}`，透明背景，`dpr={[1,2]}`
- 场景：
  - `<ambientLight intensity={0.4}/>` + 一盏定向光
  - `<Environment preset="studio">`（提供金属反射）
  - `<mesh>` + `<icosahedronGeometry args={[1, 64]} />`
  - `<MeshDistortMaterial color="#C5A9FF" metalness={0.9} roughness={0.15} distort={0.45} speed={1.6}/>`
- `useFrame` 让 mesh 缓慢自转（y 轴 0.3 rad/s，x 轴 0.1 rad/s），distort 由 material 内建 speed 自循环，形成持续起伏
- 优雅降级：若 `!('WebGLRenderingContext' in window)` 则返回 `null`

### 集成到 AsciiHandsFooter
- 在 `AsciiHandsFooter.tsx` 的根容器（相对定位那层）内、canvas 之后叠加：
  ```tsx
  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px]">
    <LiquidMetalOrb />
  </div>
  ```
- `pointer-events-none` 确保不会拦截现有 hover / click 交互
- 位置正好在两手中心（画面中央）

### 不改动的部分
- ASCII 采样、悬停马赛克、点击展开、手臂生长动画、配色 `#C5A9FF` 完全保留
- 不新增文字

## 验证
- `bun add three @react-three/fiber @react-three/drei` 后 typecheck 通过
- 预览页中央出现一个缓慢旋转 + 表面起伏的紫色金属球
- 悬停两只手仍可触发马赛克，点击仍可锁定/解锁
