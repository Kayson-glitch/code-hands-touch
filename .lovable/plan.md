## 现象
截图里黑墨周围一圈波浪状的米色边 —— 就是"闪屏"。这只出现在 2.6s 扩散过程中，不是切换瞬间。

## 根因
`LiquidBurst` 的墨形只有一层，被 `feDisplacementMap`（scale 最高 120）整体位移。位移会把靠近边缘的"透明羽化带"往内拉，露出下面 section 的米色底 `#EFE7DA`。扩散没到 100% 之前 section 底还是米色（这是设计要求，为了让黑墨在浅底上看得见），所以整段扩散过程边缘一直在闪米色。

`handleBurstCovered` 之后把 bg 切黑没问题，问题在扩散途中。

## 修改（只动 `src/components/LiquidBurst.tsx`）

在被 `filter` 位移的 `wrap` **下面**，再垫一层"实心黑底"：
- 与三层彩色渐变共享同一个 `radial-gradient(circle at cx% cy%, #000 0%, #000 <fill-shrunk>%, transparent <fill-shrunk>%)`，硬边、无羽化。
- 半径比彩色层小 6%（例：`fillSolid = fill - 6`），保证它整体位于彩色/位移边缘的**内侧**，扩散前沿看到的仍是原来的 RGB 分色羽化，不改变视觉观感。
- 这层 **不套** `filter`，不参与位移，因此永远是干净的圆/椭圆黑面，把被位移拉出的透明缝隙全部盖住 —— 边缘再也不会露米色。

在 `tick` 里同步更新这一层 background，`onCovered` / fade 逻辑保持不变（fade 时它跟着 `wrap` 之外的自己的容器一起淡出，或直接和 wrap 一起淡：把它放进 wrap 内、filter 之前的同级节点即可，被 filter 影响的只有它的兄弟节点，用 CSS 结构分开）。

具体结构：
```text
<div wrapOuter opacity=1→0>     ← 淡出统一控制
  <div solidBlack />            ← 无 filter，硬边黑底
  <div filteredInk filter=url>  ← 原来的三层彩色 + 位移
    r / c / k
  </div>
</div>
```
只需把现有的 `wrapRef` 从"filter 容器"改成"透明外壳"，filter 挪到内层新加的 `filteredInk` 上，`solidBlack` 与它平级。

## 不改动
- `spreadMs=2600` / `fadeMs=280`、easeOutBack、湍流参数、色相、羽化宽度、`AsciiHandsFooter.tsx` 的阶段机 / bg 切换时机 —— 全部保持现状。

## 验证
Playwright 打开首页 → 点球体 → 每 150ms 截图 3s：
1. 扩散过程中黑墨边缘无米色波浪缝，只保留 RGB 分色羽化；
2. 达到全覆盖后瞬时切黑、淡出过程无异常；
3. 无 WebGL Context Lost。
