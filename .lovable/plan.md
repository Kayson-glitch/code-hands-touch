## 问题诊断

控制台里能看到 `THREE.WebGLRenderer: Context Lost.` 紧跟在球体挂载之后触发。原因是当前 `LiquidMetalOrb` 里用了 `<Environment preset="studio" />` —— 这会去 drei CDN 拉取一份 HDR 环境贴图，加载/解析异常时会让 R3F 内部 Suspense 抛出、Canvas 被卸载重建，从而"闪一下就没了"。同时：

- `onExited` 回调虽然在 `LiquidMetalOrb` 里定义了，但 `AsciiHandsFooter` 并没有接，改用了硬编码的 `setTimeout(300ms)` 把 stage 切到 `hands`。这会在退出动画只播了不到一半时把整颗球从 DOM 里拆掉，进一步加剧"一闪而过"的感觉。
- `sampleImage` 里的 `IndexSizeError`（`source width is 0`）在初次 mount 时也会打断 raf 循环，可能引起额外一次重渲。属于连带隐患，一并加固。

## 修复方案

**1. 去掉 Environment，避免 WebGL context 丢失**
`src/components/LiquidMetalOrb.tsx`：
- 移除 `<Environment preset="studio" />` 和相关 import。
- 用纯灯光营造金属光泽：`ambientLight(0.35)` + 主光 `directionalLight([4,4,5], 1.4)` + 侧补光 `directionalLight([-4,-2,-3], 0.6, color=#B79BFF)` + 一颗轻微 `pointLight` 提亮高光。
- `MeshDistortMaterial` 保持 `metalness=0.85, roughness=0.2`，加 `envMapIntensity={0}` 明确不依赖 envmap。
- Canvas 增加 `gl={{ preserveDrawingBuffer: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }}`，并 `frameloop="always"`。

**2. 用回调控制卸载时机，别在动画中途拆掉球体**
`src/components/AsciiHandsFooter.tsx`：
- 新增 `orbUnmountedRef` / state：`stage !== "hands"` 时保持挂载，`stage === "orb-exit"` 期间不再依赖 `setTimeout(300)` 硬切。
- `handleOrbClick`：只 `setStage("orb-exit")`。
- 给 `<LiquidMetalOrb onExited={...}>` 传回调：动画自然结束时才 `setStage("hands")`。
- 保留 300ms 时提前触发手部生长（现在的过渡感觉是对的），改成在 `setStage("orb-exit")` 后独立起一个 `setTimeout(300, () => startIntroRef.current?.())`，但不再切 stage；stage 切换等 `onExited`。
- 渲染条件从 `stage !== "hands"` 改成"退出动画未完成"标志，确保完整 450ms 动画能播完再卸载。

**3. 加固 sampleImage 的 0 尺寸崩溃**
`src/components/AsciiHandsFooter.tsx` `sampleImage`：
- `cols`/`rows` 用 `Math.max(1, Math.floor(...))`，`resample` 里若 `w<=0 || h<=0` 直接 return，避免首个 ResizeObserver tick 抛错。

## 验证

改完后用 Playwright 打开 `http://localhost:8080/`：
- 截图确认球体持续可见、旋转、有金属高光；
- 控制台不再出现 `Context Lost` / `IndexSizeError`；
- 点击球体后录制序列截图，看到完整的放大扭曲淡出，紧接着手部生长动画淡入。
