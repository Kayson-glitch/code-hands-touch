## 目标
在 ASCII 手部页脚采样时加入透明度感知与羽化，消除去背图片边缘可能出现的锯齿/白边/黑边。仅修改 `src/components/AsciiHandsFooter.tsx` 的采样逻辑，其他视觉参数不变。

## 问题
当前 `sampleImage` 只用 RGB 亮度（Rec.709 luma）判定是否落字，忽略了 alpha 通道。对透明 PNG：
- 半透明边缘像素 RGB 常为深色（未预乘），会被误判为"深阴影"，在轮廓外围形成一圈黑色锯齿字符。
- 完全透明像素 luma=0 被丢弃，导致边缘按栅格突变，出现锯齿台阶。

## 修改（仅 `sampleImage` 内部）
1. 在 `octx.drawImage` 前设置 `octx.filter = "blur(0.6px)"`（结合已开启的 `imageSmoothingEnabled`），让下采样得到亚像素级软边。绘制完成后重置 `filter = "none"`。
2. 读取 `data[p+3]` 作为 `a = alpha/255`。
3. Alpha gate：`if (a < 0.18) continue;`（完全透明外景不落字）。
4. 用 alpha 预乘 luma：`y = a * (0.2126*R + 0.7152*G + 0.0722*B)/255`，以修正未预乘 PNG 的黑边。
5. 保留 `y > 0.04` 的暗度阈值（略低于原 0.06，配合预乘）。
6. 在最终亮度计算里加入 alpha 羽化：`const feather = Math.pow(a, 0.65); b = Math.pow(stretched, gamma) * feather;`。这样边缘半透明格自然滑向 ramp 起始的稀疏字符，形成羽化。

其余：字体、字号（FONT_PX=9）、CELL_W/H=10、RAMP、颜色映射、鼠标交互、baseline、gamma 均不变。

## 验证
- HMR 后查看页脚：手的轮廓外围不再有暗色字符锯齿，边缘字符密度平滑过渡到透明背景。
- 构建通过（无新增依赖，无 API 变更）。

范围：仅 `src/components/AsciiHandsFooter.tsx` 的 `sampleImage` 函数。