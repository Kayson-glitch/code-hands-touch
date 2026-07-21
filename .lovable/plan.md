## 诊断

- 控制台连续 `THREE.WebGLRenderer: Context Lost.` —— orb + burst 两个 WebGL Canvas 同时挂载，preview 沙箱 GPU 上下文被抢占，burst 的 shader 实际渲染为空，所以只看到 orb 收束。
- session replay 里 burst 元素挂载后 ~1.3s 卸载，时序正确，问题纯粹是"渲染不出来"。
- 顺带修一个 hydration mismatch：`<h1 class="sr-only">` 被 immersiveTranslate 浏览器插件改写引发 SSR/CSR 文本不一致，加 `suppressHydrationWarning` 即可。

## 参考图目标效果

- 中心一大团**黑色墨迹**从点击点扩散，边缘极不规则（湍流位移）。
- 墨迹边缘有明显的 **RGB 色散**（红/青偏移的光晕带），像镜头畸变。
- 底色是**浅色**（近白/米），所以黑墨迹极醒目。首屏 orb 阶段现在是纯黑，看不出黑色扩散——所以按你说的，orb 阶段背景改为浅米色 `#EFE7DA`，burst 结束后过渡到黑，hands 阶段维持黑底。

## 修改方案

### 1. `src/components/LiquidBurst.tsx` — 全部重写为 CSS + SVG，无 WebGL

结构：
```
<div fixed inset-0 z-[55] pointer-events-none>
  <svg><defs>
    <filter id="ink-wobble">
      <feTurbulence baseFrequency="0.012 0.018" numOctaves="2" seed={seed}/>
      <feDisplacementMap in="SourceGraphic" scale={displace}/>
    </filter>
  </defs></svg>
  <!-- 3 层同形状 div，做 RGB 色散 -->
  <div style={{ filter: 'url(#ink-wobble)', mixBlendMode: 'multiply' }}>
    <div class="ink-r" />  <!-- 纯红通道，translate(-6px,0) -->
    <div class="ink-g" />  <!-- 纯绿通道 -->
    <div class="ink-b" />  <!-- 纯蓝通道，translate(+6px,0) -->
  </div>
</div>
```

- 每层 `.ink-*`：`position:absolute inset-0; background: radial-gradient(circle at ${ox}% ${oy}%, <channelColor> 0% ${fillPct}%, transparent ${fillPct+4}%)`。三层用 `screen`/`multiply` 组合成黑色墨迹，位移形成红青色散。
- 更简单可行的方案：单个黑色径向渐变 + 2 个纯色（`#ff0033` 和 `#00e5ff`）微偏移的径向渐变叠在下方，`mix-blend-mode: screen` 露出边缘彩边。
- rAF 驱动：
  - `fillPct` 从 0 → 110（easeOutCubic），1000ms 覆盖全屏。
  - `displace`（feDisplacementMap.scale）从 8 → 60，营造扩散过程中越来越"起皱"。
  - `seed` 每 90ms +1，湍流持续流动。
- 覆盖阶段结束触发 `onCovered`；随后 `opacity: 1 → 0`，280ms，触发 `onFaded`。`onProgress` 保持不变。
- 保留组件签名 `{origin, onCovered, onFaded, onProgress, spreadMs, fadeMs}`，`AsciiHandsFooter` 不用改。
- 卸载 orb Canvas 的 `onExited` 逻辑保持不变。

### 2. `src/components/AsciiHandsFooter.tsx` — 首屏浅色 + 平滑切黑

- `<section>` 的 `backgroundColor` 由 stage 决定：
  - `stage === "orb" || "orb-burst"` → `#EFE7DA`（浅米，突出黑墨迹）
  - `"orb-fade" | "hands"` → `#0a0a0a`
  - 用 `transition: background-color 280ms ease-out` 平滑切换；因为 burst 覆盖时全屏是黑墨迹，底色切换被墨迹遮住，观感上就是"墨迹散去后进入黑底"。
- `<h1 class="sr-only">` 加 `suppressHydrationWarning`，消除翻译插件造成的 hydration 报错。
- 保留 `handleBurstProgress` 在 `p>=0.6` 切到 `hands`。

### 3. `src/components/LiquidMetalOrb.tsx` — 微调以适配浅底

- 在浅米背景下紫色金属球会有点糊，把 `MeshDistortMaterial` 的 `roughness` 从 0.2 提到 0.28，加一颗深色 rim light（`directionalLight position={[0,0,-3]} intensity={0.5} color="#1a0b3a"`）勾出轮廓。仅微调，不动结构。

## 验证

Playwright 打开首页：
1. 截图：浅米底 + 中央紫色 orb，控制台仅有 1 个 WebGL 上下文相关日志。
2. `page.mouse.click(cx, cy)`，之后每 100ms 截图一次连续 1.6s。
3. 肉眼确认：orb 微收束 → 黑色不规则墨迹从点击点扩散、边缘有红青色散 → 覆盖全屏 → 淡出并显露黑底 + ASCII 手部生长。
4. 控制台不再出现 `Context Lost`，也不再报 hydration mismatch。

## 技术细节

- feDisplacementMap 的 `scale` 用 CSS var + `style` 属性实时更新（SVG filter 属性也可以通过 `element.setAttribute` 每帧改；两者选后者更稳）。
- feTurbulence 的 `seed` 每 90ms 递增，避免每帧变造成明显闪烁。
- 三层色散不用真的通道分离，用 `mix-blend-mode: screen` + 偏移的彩色径向渐变最省事、跨浏览器最稳。
