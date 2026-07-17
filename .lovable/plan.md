## 问题
当前用 `延时 + cubic ease` 来做移入过渡，感觉是"卡一下再突然出现"。源网站的做法不是延时，而是让**揭示盘的位置本身做 lerp 平滑跟随光标**——光标进入时盘从上一次位置（或屏幕外）平滑滑到光标处，同时 intensity 用短时线性 lerp 起来。视觉上的"延时"来自跟随本身，而不是硬性 gate。

## 改动 `src/components/AsciiHandsFooter.tsx`

### 1. 移除硬延时 gate
删除 `INTENSITY_IN_DELAY_MS` 和 `hoverDwellMs` 相关逻辑。

### 2. 用 lerp 跟随替代 cubic ease
新增光标平滑跟随位置 `discX / discY`（和现有 `parallaxX/Y` 独立，因为盘需要更"粘"一点的跟随）：

```ts
const DISC_LERP = 0.12;   // 盘中心跟随光标的插值速率（越小越粘）
const INTENSITY_LERP = 0.08; // intensity 每帧向目标插值
```

每帧：
```ts
const targetIntensity = m.active && !prefersReduce ? 1 : 0;
intensity += (targetIntensity - intensity) * INTENSITY_LERP;

if (discX === -9999) { discX = m.x; discY = m.y; }
discX += (m.x - discX) * DISC_LERP;
discY += (m.y - discY) * DISC_LERP;
```

然后计算 `mUvX / mUvY` 时用 `discX / discY` 而不是 `m.x / m.y`。

`INTENSITY_IN_MS / INTENSITY_OUT_MS / INTENSITY_IN_DELAY_MS` 这三个常量可以移除（intensity 现在用 lerp 系数，不再基于毫秒）。

### 3. 效果
- 光标进入 → 盘从旧位置（默认屏幕外远处）以 lerp 滑向光标，同时 intensity 从 0 lerp 向 1
- 视觉上一瞬间有"跟不上"的感觉（就是源站那种），但没有生硬 gate
- 离开时盘停在原地淡出（intensity 向 0 lerp），不再需要单独 out 时长

## 不改动
- 揭示盘半径/软度/噪声（68px 相关）
- 明暗保留、视差、颜色、字体
- Parallax 的独立 lerp（`PARALLAX_LERP`）保留

## 验证
`bun run build` 通过；Playwright 在光标从画布外移入后 50ms / 200ms / 500ms 截图，确认盘平滑地追到光标位置且没有"先等再突然出现"的卡顿感。
