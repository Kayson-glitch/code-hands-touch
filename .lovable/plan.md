# 修复第一屏 / 第二屏黑底不一致

## 根因
- `src/components/AsciiHandsFooter.tsx` 第 1362 行：hero section 的黑底用的是 `#0a0a0a`
- `src/components/SloganSection.tsx`：第二屏用的是纯 `#000`
- 两者放到扫描线下叠加 blend 后，视觉差异被放大 —— 第一屏偏灰、第二屏更深

## 修复
统一为纯黑 `#000`：
- `src/components/AsciiHandsFooter.tsx` 中 `backgroundColor: bgDark ? "#0a0a0a" : "#EFE7DA"` → `"#000"`

（fallback 底层已经是 `#000`，SloganSection 已经是 `#000`，都不用改。）

## 不改动
浅色背景值 `#EFE7DA`、其它任何逻辑、组件、动画。
