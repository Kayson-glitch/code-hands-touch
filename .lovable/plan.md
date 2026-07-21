# 点击球体 → 全屏液态金属扩散

## 目标

参考 unseen.co 的过场：点击中心球体后，球体不再"放大淡出"，而是像**液态金属向外流淌**一样从球心扩散铺满整个视口，然后紫色整体淡出到黑底，再触发已有的手部生长动画。总时长约 1000ms（扩散） + ~250ms（淡出）。

## 交互流程（新）

1. `stage = "orb"`：只显示旋转的液态金属球（现状）。
2. 点击球体 → `stage = "orb-burst"`：
   - 球体本身在前 ~200ms 内快速收束（轻微缩小 + distort 拉高），作为"蓄力"起手。
   - 同时启动**全屏扩散层**：以球心为圆心，紫色液态涟漪向外扩散，~1000ms 铺满视口。
3. 铺满后 `stage = "orb-fade"`：全屏紫色在 ~250ms 内淡出到透明（露出黑底）。
4. 淡出至 ~60% 时 `stage = "hands"`：卸载球体与扩散层，触发手部生长（现有 2400ms 动画）。

## 技术方案

新增一个**全屏 WebGL 扩散层**组件 `src/components/LiquidBurst.tsx`，覆盖整个 viewport（`fixed inset-0`，z-index 高于球体但低于最终 UI），仅在 `orb-burst` / `orb-fade` 阶段挂载。

**Shader 思路（液态金属涟漪）**：

- 全屏 `<Canvas>` + 一张 `ShaderMaterial` 铺满的 plane（或 `<Effects>` 也可，简单起见走自定义 shader）。
- Uniforms：`uOrigin`（球心 UV，来自点击时读取的球体 DOM 中心）、`uTime`、`uProgress`（0→1，1000ms 内推进）、`uAspect`。
- Fragment 核心：
  ```glsl
  float d = distance(vUv * aspect, uOrigin * aspect);
  float radius = uProgress * maxDist * easeOutCubic;
  // 液态边缘：用多层 fbm/simplex 噪声扰动 d
  float n = fbm(vUv * 3.0 + uTime * 0.15) * 0.08
          + fbm(vUv * 8.0 - uTime * 0.25) * 0.03;
  float edge = smoothstep(radius, radius - 0.04, d + n);
  // 金属高光：法线方向由噪声梯度算，配合 lambert 得到流动金属反光
  vec3 base = mix(#3a1f7a, #C5A9FF, metallic);
  gl_FragColor = vec4(base, edge * uAlpha);
  ```
- 附带一层轻微 **chromatic aberration / 折射** 增强"液态金属"质感（对边缘做 RGB 通道偏移）。
- `uProgress` 用 `easeOutCubic`，让扩散前段猛、末段收；扩散完成后 `uAlpha` 用独立的 250ms `easeInOutQuad` 淡出。

**为什么用 shader 层而不是复用现有球体 Canvas**：

- 现有 `LiquidMetalOrb` 是 200×200 的局部 Canvas，尺寸不足以做全屏扩散；强行放大会拉伸失真。
- 新独立层 `fixed inset-0` 天然覆盖全屏，卸载/清理干净，不影响球体本身的旋转与蓄力动画。

**球心坐标传递**：

- `AsciiHandsFooter` 已知球体容器位置（居中 200×200）。点击时用 `getBoundingClientRect()` 拿到球心，换算成 `[x/vw, y/vh]` 作为 `uOrigin` 传入。

## 需要改动的文件

- **新增** `src/components/LiquidBurst.tsx`：全屏 shader Canvas，props: `origin: [number,number]`, `onCovered: () => void`, `onFaded: () => void`。内部管理 progress / alpha 两个动画阶段。
- **修改** `src/components/LiquidMetalOrb.tsx`：把现在的"放大淡出"退出动画改成 200ms 的"收束蓄力"（scale 0.85 + distort 上冲），到达终点后不淡出，而是等父级卸载。
- **修改** `src/components/AsciiHandsFooter.tsx`：
  - `stage` 枚举扩为 `"orb" | "orb-burst" | "orb-fade" | "hands"`。
  - `handleOrbClick` 读取球心坐标，进入 `orb-burst`。
  - 挂载 `<LiquidBurst>`，`onCovered` 后进入 `orb-fade`，淡出至 60% 时 `setStage("hands")` 并触发 `startIntroRef.current?.()`。
  - 移除现有 `orb-exit` 相关的 `exiting` prop 传递逻辑。

## 验证

用 Playwright 打开 `/`：截图球体阶段 → 点击球体 → 每 200ms 截一帧记录扩散铺满 → 确认淡出后手部生长正常启动 → 控制台无 WebGL / shader 编译错误。
