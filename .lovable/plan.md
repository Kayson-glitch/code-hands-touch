## 目标
源站细节：只有**鼠标 hover 的视差圈范围内**，字符才各自呈现独立的小角度倾斜；圈外字符保持整齐。当前的切向 tilt 是"距离光标越近越转"的连续场，但源站是**每字符独立随机相位**——像被光标"唤醒"进入手写状态。

## 修改文件
`src/components/AsciiHandsFooter.tsx`

## 实现步骤

### 1. 新增常量
```
const REVEAL_TILT_MAX_DEG = 12;   // 每字符在视差圈内的最大随机倾斜
```
保留现有 `TILT_MAX_DEG`（切向摆动）与 `TILT_FALLOFF`。

### 2. 每 cell 派生稳态随机相位（不新增字段）
利用已有的 `grid.seed[idx]` 派生一个 `-1..1` 的 shaped 相位，无需修改 Cell 类型：
```
const raw = (seed - 0.5) * 2;
const revealPhase = Math.sign(raw) * Math.pow(Math.abs(raw), 1.4);
```

### 3. 在 gooey 分支内叠加 reveal tilt
现有 `if (showGooey && grid) { ... if (sharp > 0.01) { ... } }` 已经计算了 `sharpL`（受亮度加权的圈内强度）。在该 `if` 分支内新增：
```
const revealTilt = revealPhase * REVEAL_TILT_MAX_DEG * (Math.PI/180) * sharpL;
```
把这个 `revealTilt` 加到已有的 hover 切向 `angle` 上（在 hover tilt 计算完成之后合并）。

### 4. 合成最终角度
```
const finalAngle = angle + revealTilt;   // 圈外 revealTilt=0，圈内被唤醒
```
将 transform 分支的旋转改用 `finalAngle`。`sharpL` 已随着圈内衰减 → 0，因此**圈外字符仍然完全直立**，符合"只有视差里才倾斜"的要求。

### 5. 无 hover 时快速路径
`hoverActive === false` 时 `showGooey === false`（intensity ≈ 0），gooey 分支不进入，`revealTilt` 保持 0，且 `angle` 也是 0 → 走直接 fillText 快速路径，性能不变。

## 验证
1. `bun run build` 通过。
2. Playwright 截图两种状态：
   - 无鼠标：所有字符整齐直立（对比参考图外部区域）
   - 光标停在手掌上：光标附近字符各自有独立随机倾斜，圈外仍然直立
3. 观察圈边缘：`sharpL` 平滑衰减，倾斜也随之淡出，无生硬圈边。

## 预期
- 视差圈内字符像被光标"唤醒"，各自呈参考图那样的独立小角度
- 圈外保持整齐网格，符合源站细节手感
- hover 切向摆动与每字符随机倾斜自然叠加
