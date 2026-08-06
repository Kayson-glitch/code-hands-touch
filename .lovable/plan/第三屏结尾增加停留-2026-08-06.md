# 第三屏结尾增加停留

## 目标
三列数字全部就位后，模块不要立刻被推走。让画面在完整状态下"钉住"停留一段滚动距离，用户可以看清整屏内容，再继续往下滚。

## 做法
1. 在第三屏的滚动轨道末尾追加一段"停留区"（约 0.8 屏高度）。sticky 容器在这段距离里保持钉住不动，画面完全静止。
2. 动画进度重新映射：三列的入场在停留区开始前就已经 100% 完成，停留区内进度恒为 1，所以视觉上是"全部到位后静止"。
3. 停留结束后，滚动照常继续到底部的 {Artemis} delivers certainty。
4. 移动端与 prefers-reduced-motion 情况保持现状，不加停留。

## 技术细节
- `src/components/MetricsSection.tsx`
  - 新增常量 `HOLD_VH = 0.8`，wrapper 高度改为 `cardHeight * CARDS.length + window.innerHeight * HOLD_VH`。
  - 进度计算的 `distance` 只取"动画段"长度（wrapper 高度减去停留段再减去 `innerHeight * 0.8`），使 `progress` 在进入停留段时已达到 1，之后被 `clamp` 钳住。
  - 把 `innerHeight` 存入 state 并在 resize/measure 时更新，保证换视口后轨道长度正确。
- CSS 无需改动。

## 验证
用浏览器在停留区前/中/后多个滚动位置截图，确认三列数字完整可见、停留期间画面静止、之后正常过渡到 footer，控制台无报错。
