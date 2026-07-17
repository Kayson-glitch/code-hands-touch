# 将 ASCII 手部 footer 的悬停揭示光斑调整到 68px

用户要求把鼠标移入时的亮斑大小精确设为 68px 直径。当前 `GOOEY_RADIUS_UV = 0.035`，在常见视口（minWH ≈ 1064px）下产生约 74px 直径的光斑，仍略大于目标。

## 调整方案（`src/components/AsciiHandsFooter.tsx`）

### 1. 主半径：按 68px 直径反推 UV 值

目标半径 = 34 CSS px。按当前视口 minWH ≈ 1064px 计算：

```
GOOEY_RADIUS_UV = 34 / 1064 ≈ 0.032
```

- `GOOEY_RADIUS_UV`: `0.035` → `0.032`

### 2. 柔和边缘与噪声：比例缩放，保持边缘相对质感

保持 soft edge / noise 与 radius 的相对比例，避免光斑缩小后边缘变得过硬或过于粗糙：

- `GOOEY_SOFTNESS_UV`: `0.025` → `0.023`（约 0.714 × radius）
- `GOOEY_NOISE`: `0.012` → `0.011`（约 0.343 × radius）

### 3. 其他参数保持不变

- `PARALLAX_MAX = 8`：保留现有的轻微视差
- `INTENSITY_IN_MS`、`INTENSITY_OUT_MS`：保留现有淡入淡出时长
- 颜色、字符集、采样逻辑、布局等全部不变

## 验证方式

- 在预览中移动鼠标，观察亮斑外缘直径约为 68px（约 6-7 个 10px 网格单元）。
- 在不同宽度视口下（桌面、较窄窗口）确认光斑随 minWH 等比例缩放，始终维持相近的物理尺寸。