## 目标
让"轻微滚动"就能推进"轻微视频进度"，消除吸附到关键帧的顿挫，回滚立即跟手。

## 根因
当前 `intro-hands.mp4` 是普通 H.264（有 GOP），浏览器 seek 只能落在关键帧上，微滚动被吸附。1916×1080 / 24fps / 97 帧 / 4.04s / 2.98MB。

## 步骤

### 1. 重新编码 all-intra（每帧都是关键帧）
在 sandbox 内用 ffmpeg 生成，输出到 `/mnt/documents/intro-hands-allintra.mp4`：

```
ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 18 \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -x264-params "keyint=1:min-keyint=1:no-scenecut" \
  -pix_fmt yuv420p -movflags +faststart out.mp4
```

预计体积 8–12MB（3–4×）。逐帧精确 seek，无关键帧吸附。

### 2. 替换 asset
覆盖 `src/assets/intro-hands.mp4.asset.json` 指向新文件；旧 asset 通过 CDN immutable 缓存不影响老会话。

### 3. 微调 `src/components/IntroVideo.tsx` 参数
- `PROGRESS_SMOOTH_TIME`: 0.055 → **0.035**
- `GAP_DEAD_ZONE`: 0.02 → **0.008**
- `GAP_BACKWARD_SEEK`: 0.05 → **0.02**
- `BACKWARD_SEEK_MIN_INTERVAL_MS`: 45 → **16**
- `playbackRate` 上限保持 4.0

理由：all-intra 后 seek 成本极低，可以去掉节流让反向立即响应，同时缩小死区让 10px 级滚动就能推进进度。

### 4. 验证
Playwright 打开首屏，滚动 10 / 50 / 200 px 三档，读取 `video.currentTime` 与 `scrollY` 对应关系是否线性；网络面板确认新视频体积。若微滚动仍感觉粗，再上备选 A2（`minterpolate` 补帧到 48fps，最小可感进度从 42ms 降到 21ms，体积再翻倍）。

## 需要确认
- 体积 3MB → ~10MB 是否接受
- 是否同时准备 A2（48fps）备选
