## 目标
根据参考图，源站每个字符都带有**独立的、静态的微小倾斜**（各不相同的角度，非鼠标驱动），叠加在整齐网格之上形成"手写/手抖"的质感。这是与 hover 视差**并存**的第二层旋转。

## 观察
参考图中：
- 无鼠标交互时字符已经带旋转，各自角度不同（±10° 左右范围）
- 每个字符的旋转是**稳定的**（不闪烁），像烘焙进网格的随机相位
- hover 的切向摆动应叠加在这个基础倾斜之上

## 修改文件
`src/components/AsciiHandsFooter.tsx`

## 实现步骤

### 1. 每 cell 烘焙一个稳态倾斜角
`sampleImage` 中已经有 `grid.seed`（0..1 per-cell 随机数）。在 `Cell` 类型新增：
```
baseTilt: number;  // 弧度，稳定不变
```
在 push cell 时用 `seed` 派生：
```
const rawTilt = (seed - 0.5) * 2;              // -1..1
const shaped  = Math.sign(rawTilt) * Math.pow(Math.abs(rawTilt), 1.4); // 集中在小角，偶尔大角
baseTilt = shaped * (BASE_TILT_MAX_DEG * Math.PI / 180);
```

### 2. 新增常量
```
const BASE_TILT_MAX_DEG = 10;   // 单字符静态最大倾斜（度）
```
（当前 `TILT_MAX_DEG = 8` 是 hover 追加的动态角，两者独立。）

### 3. 渲染时合并两种角度
在计算 `angle`（hover tilt）之后：
```
const finalAngle = c.baseTilt + angle;
```
把原来的 `if (angle !== 0)` 改为 `if (finalAngle !== 0)`，用 `finalAngle` 做 rotate。这样：
- 无 hover：只有静态 baseTilt → 每字符已经天然倾斜
- 有 hover：叠加动态切向摆动

### 4. 快速路径调整
现在几乎所有 cell 都会进入 transform 分支（因为 baseTilt 极少为 0），需要确保性能可接受：
- transform 分支已经存在 save/rotate/restore，是 O(N) 常数因子略增
- 由于 cell 总数 ~1.2 万且大多数被 intro/剔除掉了实际绘制在几千级别，可接受
- 若性能受影响，可以对 `|finalAngle| < 0.005` 走快速路径（几乎不转）

### 5. intro 时序
intro 期间字符渐入，baseTilt 应从生成就存在（不做过渡），符合源站直接"落"进倾斜状态的感觉。

## 验证
1. `bun run build` 通过。
2. Playwright 截图：无鼠标状态下放大观察，字符应像参考图那样各自略微歪斜；hover 时切向摆动叠加，字符不"抖动式"跳变。

## 预期
- 静态时字符已呈现参考图的手工质感（每个字符独立小角度倾斜）
- Hover 时切向摆动仍然生效，两层旋转自然叠加
- 更接近源站的细节层次
