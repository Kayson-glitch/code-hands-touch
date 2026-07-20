## 目标
把 Matrix 数字雨作为首页背景，ASCII 双手效果叠加在上层。

## 实施步骤

1. **新建组件** `src/components/ui/matrix-code-rain.tsx`
   - 采用提供的组件逻辑，但做以下调整以适配"背景"场景：
     - 组件根元素改为 `absolute inset-0 w-full h-full`，canvas 占满父容器
     - 移除右上角 Settings 齿轮按钮和设置面板（背景不需要 UI 控制）
     - 保留可配置的 props：`fontSize`、`speed`、`density`、`textColor`，全部有默认值
     - 默认颜色改为紫色系（`#C5A9FF`）以匹配当前 lavender 主题，而非原生绿色，保持视觉统一
     - 背景填充由 `#000000` 改为半透明黑 `rgba(0,0,0,0.08)` 做拖尾淡出（不覆盖父层黑底）
   - 修复原代码中 JSX 缺失的问题（原贴代码 return 部分是空的），按 shadcn/tsx 规范补齐

2. **修改首页** `src/routes/index.tsx`
   - 用一个 `relative min-h-screen bg-black` 容器包裹
   - 底层：`<MatrixCodeRain />`（`absolute inset-0 z-0`）
   - 上层：`<AsciiHandsFooter />`（`relative z-10`）
   - AsciiHandsFooter 内部 canvas 本身背景是黑色，需要确认它是否让 Matrix 透出——如果它自身填了不透明黑，需要把外层 wrapper 背景改为透明才能看到 Matrix

3. **AsciiHandsFooter 透明化（如必要）**
   - 检查 `AsciiHandsFooter.tsx` 的 canvas 每帧 `fillRect` 是否用不透明黑覆盖；若是，改为在渲染开始时用 `ctx.clearRect` 或者去掉背景填充，让下层 Matrix 透上来
   - 这是让"作为背景"生效的关键点

4. **依赖**：`lucide-react` 已在项目中（AsciiHandsFooter 未用，但 shadcn 项目已安装），无需新增

## 需要你确认

- **叠加方式**：Matrix 数字雨在**下层**做背景，ASCII 双手完全叠在上面（双手 canvas 透明化，能看到数字雨从双手后方穿过）？还是双手保持不透明黑底，Matrix 只在双手周围空白区可见？
- **颜色**：Matrix 用当前主题紫 `#C5A9FF`，还是保留经典绿 `#00FF41`？
- 若透明化双手 canvas 影响现有效果观感，是否接受？（现有的描边、视差、发光都是基于黑底调过的）
