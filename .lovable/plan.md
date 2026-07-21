## 目标
把墨迹扩散时长增加到 2.6s；消除切换阶段的"闪屏"。

## 根因（已核对代码）
`AsciiHandsFooter.tsx` 里调用 `LiquidBurst` 时硬编码 `spreadMs={1000}`，之前改到 1600 的默认值被 props 覆盖 —— 所以用户看到的一直是 1s。

"闪屏"来源：`section` 背景在 `orb-fade` 阶段用 `transition: background-color 280ms ease-out` 从 `#EFE7DA` 渐变到 `#0a0a0a`。由于 `easeOutBack` 让墨迹半径先冲过 100% 再回弹，加上羽化带 `transparent` 部分，覆盖并不是 100% 不透光；背景色在这一瞬间正好在跨渐变，透过羽化带就看到底色从米色跳到黑色 —— 就是那道"闪"。

## 修改（仅前端表现层，只改 `src/components/AsciiHandsFooter.tsx`）

1. **加时长**：把 `<LiquidBurst spreadMs={1000} … />` 改成 `spreadMs={2600}`，`fadeMs` 保持 280。
2. **消除闪屏**：
   - `section` 的 `transition: background-color …` 去掉，改为在 `handleBurstCovered` 触发后立刻把背景设为 `#0a0a0a`（用一个 `bgDark` state；不再依赖 `lightBg` 派生 + CSS 过渡）。
   - 切换时机就在墨迹 `rawP >= 1`（完全覆盖）的一帧，此时整屏被黑墨盖住，切换背景色不可见。
   - 保留 `handsVisible` 触发的 canvas/wordmark 淡入（300–400ms），它们在黑底下淡入，不会再叠加背景变色。
3. `LiquidBurst.tsx` 不动 —— 弹性 / 湍流 / 位移 / 羽化保持不变。

## 验证
Playwright 打开首页 → 点击球体 → 每 200ms 截图共 3.4s：
1. 扩散约 2.6s 完成，弹性收束仍在；
2. 墨迹达到全屏那一刻背景已经是黑色，之后墨迹淡出直接露出黑底 + 手部，无任何米色到黑色的中间过渡帧；
3. 无 WebGL Context Lost。
