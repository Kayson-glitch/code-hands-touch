## Goal

以 1440×900 为基准视口重新协调「标题组 + 手部」的上下关系，并把手部画布的默认渲染宽度限制为 1440px（居中）而非始终撑满视口。其他断点按同一比例等比推导。

## 1. 手部画布宽度：默认 1440px 上限

`src/components/AsciiHandsFooter.tsx`（画布 `<canvas>` 容器）

- 外层容器改为 `left: 50%; transform: translateX(-50%); width: min(100vw, 1440px);`，去掉 `inset-x-0 w-full`。
- 保持 `top` / `height` 由 `useHeroLayout` 提供，绝对定位不变。
- 效果：≥1440px 屏幕上手部固定 1440px 宽居中，&lt;1440px 时仍按 100vw 自适应，不裁剪。

## 2. 1440×900 基准下的标题 / 手部位置

以 900px 视口高度为基线（导航 68px 已扣除感知），把 vh 换算成 px 便于校核：

```text
Nav                 0   – 68
Title block start   180 (padding-top 20vh)
  H1 (48/56 ×2 行)  180 – 292
  Subtitle (16/24)  312 – 336
  CTA (h40, mt-32)  368 – 408
Hands canvas        top 430  height 460  → bottom 890
```

- Title 组底端 (408) 与手部顶端 (430) 之间留 ~22px 呼吸，整体重心居中，底部贴近首屏底。
- 桌面 `DESKTOP`：
  - `titlePaddingTop: "20vh"`
  - `handsTop: "calc(48vh - 8px)"`
  - `handsHeight: "51vh"`
- `SHORT`（h ≤ 819）：`titlePaddingTop: "16vh"`, `handsTop: "44vh"`, `handsHeight: "54vh"`。
- `TABLET`：`titlePaddingTop: "18vh"`, `handsTop: "46vh"`, `handsHeight: "52vh"`。
- `MOBILE`：`titlePaddingTop: "12vh"`, `handsTop: "42vh"`, `handsHeight: "56vh"`（保持字号 32/40）。

## 3. 其它不变

- 字号 / 字重 / 渐变文字 / 副标题 / CTA 尺寸均保持当前值。
- 手部内部渲染逻辑、悬停、马赛克、点击锁定、intro 视频层全部不动。
- 导航栏、聊天 dock 不动。

## 验证

- 1440×900、1280×800、1920×1080、iPad、iPhone 各截一张，确认标题-手部间距一致居中，且 ≥1440px 时手部宽度锁定 1440。
