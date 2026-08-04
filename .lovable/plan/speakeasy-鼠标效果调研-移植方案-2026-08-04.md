# Speakeasy 鼠标效果调研 + 移植方案

## 一、他们到底做了什么

Speakeasy 首页的手部是 **WebGL 后处理式 ASCII**，鼠标效果不是 hover 高亮，而是一层**流体模拟**：

1. **字符化是一个 shader（ASCIIEffect）**
   - 一张 1024×1024 的字形图集，字符集只有 16 个：`` -V-/V\/A-•AV/\• ``
   - 每个格子取源图亮度 → `charIndex = floor(gray * charLength)` → 从图集取对应字形
   - 浅色主题下颜色做反相（`1.0 - color.rgb`），所以纸白底上是深字

2. **鼠标 = 往流体场里"泼墨"**
   - 后台跑一个 GPU 流体（velocity / pressure / curl / dissipation / splat 那一套）
   - 鼠标移动按速度方向注入速度和染料，松手后靠 dissipation 慢慢消散
   - 字符层再采样这张流体密度图：`uFluidDensity`

3. **染料如何影响字符**
   - `fluidDensity = length(density.rgb)`，低于阈值(10)完全不生效
   - 密度映射成色轮 hue（`uColorWheel`，hue 还随 `uTime` 缓慢漂移）→ 这就是你截图里那团暖橙转黄绿的颜色
   - 密度同时抬高亮度（`fluidMultiplier` 1.0→1.5），亮度抬高就换到 ramp 里更"重"的字形

**关键结论**：好看的不是"色块"，而是 —— 鼠标像在水面上划过，留下一条**有惯性、会流动、会慢慢消散的彩色染料轨迹**，而字符本身的形体完全没被遮挡，只是被"染色 + 提亮换字"。

## 二、我们现在的问题

我们的实现是 2D canvas 逐格 `fillText`，鼠标效果是"马赛克色块揭示"：
- 画方块 → 遮住字符（他们从不遮）
- 一次性圆盘 + 硬边 → 没有惯性和流动
- 立刻消失 → 没有消散尾迹

## 三、移植方案（不上 three.js，2D canvas 就能做）

在 `src/components/AsciiHandsFooter.tsx` 内做三件事：

**1. 删掉马赛克层**
移除 `MOSAIC_*` 相关的方块绘制（两处 tile 渲染分支），字符层永远是唯一可见层。

**2. 加一个格子级"染料场"（轻量流体）**
在字符网格分辨率上（不是像素级，成本极低）维护三个 Float32Array：`dyeR/G/B`（或单通道 dye + 单独 hue）、`velX/velY`。每帧：
- 鼠标移动 → 在光标格附近按高斯半径注入 dye，并按鼠标位移方向注入速度（这就是惯性来源）
- semi-Lagrangian 单步 advect（按 vel 回溯采样）+ 轻微 blur 扩散
- `dye *= dissipation`（约 0.94/帧）、`vel *= 0.96`

**3. 字符层消费染料场**
每格拿到 `d = dye[i]`：
- 亮度：`bb += d * BOOST`，即染料让该格跳到 ramp 里更重的字形（等价于他们的 fluidMultiplier）
- 颜色：`d` 低于阈值 → 保持石墨灰；超过阈值 → 按 `d` 在一条自定义色带上取色（暖橙 → 黄 → 青绿），并随时间缓慢漂移 hue，再按 `d` 与灰色做 mix，保证边缘自然过渡
- 色带做成常量数组，方便调色

## 四、参数（暴露为文件顶部常量，方便调）

| 常量 | 作用 | 初值 |
| --- | --- | --- |
| `DYE_RADIUS` | 注入半径（格） | 3.5 |
| `DYE_INJECT` | 每帧注入强度 | 1.0 |
| `DYE_DISSIPATION` | 消散 | 0.94 |
| `VEL_INJECT` | 鼠标位移→速度增益 | 0.35 |
| `VEL_DAMP` | 速度衰减 | 0.96 |
| `DYE_CHAR_BOOST` | 染料对字形加重的强度 | 0.35 |
| `DYE_COLOR_MIN` | 开始上色的阈值 | 0.08 |
| `HUE_DRIFT` | hue 随时间漂移速度 | 0.05 |

## 五、技术说明

- 全部在现有 `requestAnimationFrame` 循环内完成，网格约 200×80 = 16k 格，advect + 上色单帧 < 1ms，不需要 WebGL。
- 不改几何采样、分指连通域、轮廓判定与流动动画逻辑，只替换"鼠标交互层"和"每格取色"这两处。
- 尊重 `prefers-reduced-motion`：开启时不注入染料，保持静态石墨灰。
