# 自适应对齐规则

## 目标
参考图比例是在 ~1440×900 桌面下校准的（标题 top ≈ 24vh，手部 canvas top ≈ 55vh − 20px，高 45vh）。在更矮/更高/更窄的屏幕下这些固定 vh 值会让标题与手部脱节或重叠。把这些偏移改成随视口自适配的规则。

## 校验矩阵
在以下断点下截图对比与参考图一致性：
- 1920×1080（宽屏桌面）
- 1440×900（基准，参考图）
- 1280×800（小笔记本）
- 1024×720（矮屏笔记本）
- 834×1112（iPad 竖屏）
- 390×844（手机竖屏）

关注两项：
1. 标题基线到指尖顶端的垂直间距（参考图 ≈ 12vh @900px 高）
2. 手部 canvas 底边贴合视口底（永远 `bottom:0` 对齐）

## 自适配规则

### 断点分层（用 CSS `clamp()` + `matchMedia`）
| 维度 | ≥1200w & ≥820h（桌面基准） | 720–819h（矮屏） | ≤1199w（平板） | ≤767w（手机） |
|---|---|---|---|---|
| HeroCopy `paddingTop` | `clamp(20vh, 24vh, 26vh)` | `18vh` | `20vh` | `14vh` |
| HeroCopy 标题 `fontSize / lineHeight` | 48 / 56 | 44 / 52 | 40 / 48 | 32 / 40 |
| Hands canvas `top` | `calc(55vh - 20px)` | `calc(52vh - 16px)` | `50vh` | `46vh` |
| Hands canvas `height` | `45vh` | `48vh` | `50vh` | `54vh` |

以上保证：标题组 + 手部作为一个整体上下居中，且指尖始终位于视口 55–60% 处（参考图特征）。

### 实现方式
用一个新的 hook `useHeroLayout()` 返回 `{ titlePaddingTop, titleFontSize, titleLineHeight, handsTop, handsHeight }`，在 `HeroCopy` 与 `AsciiHandsFooter` 中共用。hook 内部：
- `window.matchMedia` 监听三个断点：`(max-width: 767px)`、`(max-width: 1199px)`、`(max-height: 819px)`
- 返回值随断点切换，写入 style
- resize/orientationchange 时更新

canvas 高度变化时依赖已有的 ResizeObserver 重排 grid，无需额外改动。

## 交付
- 新增 `src/hooks/useHeroLayout.ts`
- 修改 `src/components/HeroCopy.tsx` 与 `src/components/AsciiHandsFooter.tsx` 应用 hook 返回值替换固定 vh
- 用 Playwright 在 6 个断点截图并 `code--view` 逐一验证标题↔手部间距与参考图差距 ≤ 5%
