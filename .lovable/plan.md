# 方案 B：1:1 复刻 Shopify Winter 2026 的 shader 扩散

放弃当前的 Canvas 2D 粒子系统 — 它做不出参考视频里那种"从指尖爆开的液态光晕 + 边缘距离场发光 + 视频扭曲"的质感。改用 Shopify 同款技术栈：**Three.js 全屏后期 shader + VideoTexture**，把视频本身当作纹理送进 GLSL，用一个 `uProgress` 驱动全过程。

## 效果对齐参考视频

1. **视频视差**：不是 CSS scale，而是在 shader 里做 `uv = (uv - center) * (1 - progress*0.12) + center`，围绕指尖中心轻微缩放/挤压
2. **指尖爆点**：滚到 60% 后，从指尖 UV 生成一个圆形距离场 `d = length(uv - center) - radius(progress)`
3. **液态边缘**：`edge = smoothstep(0.0, 0.08, d) - smoothstep(-0.04, 0.0, d)`，形成一圈亮环
4. **有机扰动**：`d += fbm(uv*4.0 + uTime*0.3) * 0.06`，边缘变成不规则墨滴形
5. **色散**：R/G/B 三通道分别用不同 offset 采样视频纹理，边缘处偏移量随 `edge` 放大 → 参考视频里那种彩色边
6. **中心镂空 → 白光爆开**：`radius` 越过 1.0 后，圆盘内部由"透视频"渐变为"纯白 + 星尘噪点"，最终 `progress → 1.5` 时全屏白/黑，触发手部阶段

## 交互流程（不变）

- 滚轮 0–60%：驱动 `video.currentTime` + shader `uProgress` 做视差
- 滚轮 60–100%：视频停在末帧，`uProgress` 从 0.6 推到 1.5，扩散铺满
- 反向滚动完全可逆
- `progress >= 1.5` 持续 ~200ms → 切 `stage: 'hands'`

## 技术实现

### 新文件 `src/components/VideoBurstShader.tsx`
- `<canvas>` + 原生 Three.js（不用 R3F，避免上下文冲突）
- 一个正交相机 + 全屏 plane
- `THREE.VideoTexture(videoElement)` 作为 `uVideoTex`
- Uniforms: `uProgress`, `uCenter (vec2)`, `uTime`, `uResolution`, `uVideoTex`
- Fragment shader（约 80 行 GLSL）：
  ```glsl
  // 视差
  vec2 uv = (vUv - uCenter) * (1.0 - uProgress * 0.12) + uCenter;
  // fbm 扰动
  float n = fbm(uv * 4.0 + uTime * 0.3);
  // 距离场
  float r = smoothstep(0.6, 1.4, uProgress) * 1.2;
  float d = length(uv - uCenter) - r + n * 0.08;
  // 色散采样视频
  float chroma = smoothstep(0.0, 0.15, abs(d)) * 0.02;
  vec3 col;
  col.r = texture2D(uVideoTex, uv + vec2(chroma, 0.0)).r;
  col.g = texture2D(uVideoTex, uv).g;
  col.b = texture2D(uVideoTex, uv - vec2(chroma, 0.0)).b;
  // 边缘光
  float edge = exp(-abs(d) * 40.0);
  col += vec3(1.0, 0.95, 1.05) * edge * smoothstep(0.6, 1.0, uProgress);
  // 内部褪白
  float inside = smoothstep(0.0, -0.2, d);
  col = mix(col, vec3(1.0), inside * smoothstep(1.0, 1.5, uProgress));
  gl_FragColor = vec4(col, 1.0);
  ```

### 改造 `IntroVideo.tsx`
- 视频保留但设 `visibility: hidden` — 只作为纹理源，画面由 shader 输出
- 滚轮累加器直出 `progress ∈ [0, 1.5]`；`videoProgress = min(1, progress/0.6)` 驱动 `currentTime`
- 通过 `onProgress` 把 `progress` + 指尖 UV (0.5, 0.5) 传给 `VideoBurstShader`
- 滚到 1.5 触发 `onEnded`

### 删除
- `src/components/StardustBurst.tsx` — 完全废弃

### `AsciiHandsFooter.tsx`
- 移除 `<StardustBurst>` 引用
- `<IntroVideo>` 内部自带 `<VideoBurstShader>`，footer 不感知

## 风险与回退

- **WebGL 上下文丢失**：之前 orb+burst 双 Canvas 出过。这版只有一块 WebGL Canvas（视频当纹理），安全。
- **视频跨域**：`videoAsset.url` 是同域 CDN，无 CORS 问题；如遇到就加 `crossOrigin="anonymous"`。
- **prefers-reduced-motion**：shader 里 `uProgress` 直接跳到 1.5，跳过扰动动画。
- 若最终 shader 效果仍不满意，回退到"视频 + CSS 径向遮罩 + backdrop-filter blur"简化版。

## 验收标准

滚轮到 60% 后：
1. 视频画面本身出现色散彩边（红蓝分离）
2. 指尖处爆出一圈不规则液态白光，向外扩散
3. 光环边缘有 fbm 扰动，不是完美圆
4. 铺满后视频被白光吞没，切手部阶段
