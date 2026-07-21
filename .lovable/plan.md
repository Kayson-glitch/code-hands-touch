## 现状问题
`LiquidBurst.tsx` 目前用 SVG 多边形 + 手写噪声近似墨滴，无论怎么调参都是「多层几何图形叠加」的观感：边缘锯齿、色散生硬、无真实流体感、glitch 条突兀。参考站（unseen.co）的效果是像素级的流体位移 + chromatic aberration + noise mask，SVG 天花板已经到顶，必须换到 WebGL/shader。

## 方案：Three.js 全屏 shader pass

新建 `src/components/LiquidBurst.tsx`（替换现有实现），用 `@react-three/fiber` 挂一个全屏 `<Canvas>`，内部只渲染一个覆盖整屏的正交 quad，所有视觉效果由 fragment shader 完成：

### Shader 结构
Uniforms:
- `uTime` — 秒
- `uProgress` — 0→1 扩散进度（JS 侧用曲线映射，保持 2.6s 总时长）
- `uOrigin` — vec2，指尖 UV 坐标（复用现有 `origin` 传参换算）
- `uResolution` — vec2
- `uAspect` — float

Fragment 主流程：
1. **距离场**：`d = distance(uv*aspect, origin*aspect)`。
2. **有机边界**：叠加 3 层 simplex/valueNoise（低/中/高频，频率随 progress 变化），生成 `mask = smoothstep(edge+feather, edge-feather, d + noise*amp)`。伪足由低频 noise 的高振幅提供，天生连续没有多边形拼接感。
3. **白色发光边**：在 `mask` 边缘 ±feather 范围内加一层稍亮的乳白 rim（`smoothstep` 差值），随扩散半径同步移动，避免现在 SVG 版的"halo 层跟不上"。
4. **RGB 色散**：分别用 `mask(uv + offset)` / `mask(uv - offset)` 采样 R 和 B 通道，offset 方向由 `uv - origin` 法线 + 时间旋转决定，宽度随 progress 线性增加（参考效果里越扩散越宽）。这是真·色散，不是叠色。
5. **中段 glitch**：在 `progress ∈ [0.15, 0.85]` 时，按 `floor(uv.y * N)` 分行，用 hash(row, floor(time*8)) 做水平 UV 偏移，仅作用于 mask 外部的 rim/背景区，产生扫描线错位，节奏由 shader 内部决定而非 JS 定时器，抖动更自然。
6. **输出**：alpha = mask，rgb = 黑心 or rim 白 or 色散边混合。

### JS 侧
- 保持现有 props 接口（`origin`、`onCovered`、`onFaded`、`onProgress`、`spreadMs`、`fadeMs`）不变，`AsciiHandsFooter.tsx` 不动。
- `useFrame` 里推进 `uProgress`（曲线：0–0.25 easeOutQuad → 0.25–0.85 线性 → 0.85–1 轻弹性），达到 1 时触发 `onCovered`，然后 CSS opacity 淡出 → `onFaded`。
- Canvas 设置 `gl={{ alpha: true, premultipliedAlpha: false }}`，`dpr=[1, 2]`，`frameloop="always"`，`zIndex: 70` 覆盖视频。
- 用独立 Canvas 而不是复用 orb 的，避免 WebGL context 冲突（历史上出过 context loss）。

### 删除
- 现在的所有 SVG polygon / rect / ref、`makePoints`、`smoothNoise`、glitch bar 定时器 —— 整个 `LiquidBurst.tsx` 重写。

## 验证
Playwright 触发 `IntroVideo` 的 `onEnded` 跳过播放，在 `t = 0.4/1.0/1.6/2.2/2.6s` 截图，对照参考视频关键帧：
- 边缘是像素级流体位移，无多边形折线
- R/C 色散只出现在墨滴外侧偏移方向的一条窄带
- 白色 rim 平滑跟随
- 无背景漏光、无 SVG 描边闪烁

## 技术细节

- 依赖：项目已装 `three` / `@react-three/fiber` / `@react-three/drei`（`LiquidMetalOrb` 在用），无需新增。
- Shader 用 `ShaderMaterial`，inline GLSL 字符串，避免额外 loader。
- Noise 用便宜的 hash-based value noise（GPU 上跑得起 3 层），不引入 `glsl-noise` 依赖。
- 全屏 quad：`<mesh><planeGeometry args={[2,2]}/></mesh>` + `OrthographicCamera` 或直接用 clip-space vertex shader。
- Resize 监听 window，更新 `uResolution` / `uAspect`。
- SSR 安全：组件顶部 `useState(false) + useEffect(()=>setReady(true))` 门控挂载（沿用现在写法）。
