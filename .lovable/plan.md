## 目标
在开屏视频阶段叠加一个浮动调参面板，让你实时调整 burn 光圈的 shader 参数，边看边调，参数即时映射到 `IntroVideo.tsx` 的 shader uniforms。

## 面板位置与形态
- 右上角固定浮层（`position: fixed; top: 88px; right: 16px; z-index: 200`），半透明深色背景 + 毛玻璃，宽约 260px。
- 顶部标题「Burn Ring Debug」+ 折叠按钮（默认展开，可收起为小圆点，避免挡视觉）。
- 底部两个按钮：`Reset`（回到当前代码默认值）、`Copy JSON`（把当前参数复制到剪贴板，便于我之后写回 shader 常量）。
- 仅在开发预览时挂载（通过 prop 开关），发布态不显示。

## 可调参数（分 3 组，与你诉求一一对应）

### 1. 不规则度（轮廓形状）
- `warpAmp`：domain-warp 强度（0 – 0.5）
- `warpFreq`：warp 噪声频率（0.5 – 6）
- `streakAmp`：各向异性长条噪声幅度（0 – 0.4）
- `streakFreq`：长条频率（1 – 12）
- `angularAmp`：极角扰动幅度（0 – 0.3）
- `angularFreq`：极角扰动波数（2 – 20）

### 2. 噪声强度（burn 阶段的故障/颗粒）
- `chromaAberration`：径向色差像素量（0 – 20）
- `shardDisplace`：马赛克碎片位移（0 – 40）
- `grainAmount`：颗粒噪点强度（0 – 1）
- `glitchFlicker`：故障闪动强度（0 – 1）

### 3. 边缘层透明度（4 层辉光）
- `coreRimAlpha`：核心亮边不透明度（0 – 1）
- `hotHaloAlpha`：暖白热辉不透明度（0 – 1）
- `cloudDiffuseAlpha`：云雾扩散层不透明度（0 – 1）
- `mistAlpha`：颗粒外雾不透明度（0 – 1）
- `haloFalloff`：辉光向外衰减指数（1 – 6）

每个参数：`label + range slider + 数值输入框（可精确输入）+ 当前值显示`。

## 技术方案

### 新文件：`src/components/BurnDebugPanel.tsx`
- 受控组件，接收 `values`、`onChange(next)`、`onReset`、`onCopy`。
- 内部纯 UI + slider 控件，无副作用。

### 修改 `src/components/IntroVideo.tsx`
- 抽出所有上述常量为 `DEFAULT_BURN_PARAMS` 对象。
- 用 `useState<BurnParams>(DEFAULT_BURN_PARAMS)` 保存当前值。
- shader 中把这些数字改为 `uniform float u_xxx`，在 render loop 里每帧从 state ref 同步到 uniforms（避免频繁重编译 shader）。
- 顶层挂载 `<BurnDebugPanel>`，仅在 `import.meta.env.DEV` 或新 prop `debug` 为真时渲染。
- `Copy JSON` 输出形如 `{ warpAmp: 0.18, ... }`，方便定稿后我把默认值写回代码。

### 不改动
- 光圈触发时机、时长（3600ms）、缓动曲线、扩张同步、handoff 逻辑、hero UI 淡入节奏——全部保持现状。
- ASCII hands / preloader / nav / chat dock 均不动。

## 交付后使用流程
1. 打开预览，滚到视频末端触发 burn。
2. 在扩散过程中拖动 slider，效果实时变化。
3. 觉得对了点 `Copy JSON`，把值发给我，我写回 `DEFAULT_BURN_PARAMS` 并可选择性下线面板。

需要我按这个方案实施吗？如要调整（比如面板位置、增删参数、发布态也保留），告诉我改动点。