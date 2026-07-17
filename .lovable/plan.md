## 目标

把当前 ASCII 双手页面的全部实现（路由 + 组件 + 参数 + 资源接入方式）打包成一个可复用的 skill，之后在任意项目里只要"上传一张新图片"就能一键复刻同款效果，无需重新调参或复制大段代码。

## 交付物

在仓库中新增一个 skill：`.agents/skills/ascii-image-footer/`，由 `skills--apply_draft` 激活后进入 `.workspace/skills/`，可在后续任何项目里被检索到并按步骤执行。

结构：

```text
.agents/skills/ascii-image-footer/
├── SKILL.md                          # 触发说明 + 执行步骤
├── assets/
│   └── AsciiHandsFooter.tsx          # 当前组件的完整拷贝（811 行，含全部参数与注释）
└── references/
    ├── route-template.tsx.txt        # src/routes/index.tsx 的模板（title / description 占位）
    └── tuning-notes.md               # 已定稿的参数说明（PARALLAX_MAX=13、FONT_PX=8、GOOEY_* 等），说明"默认不要改，只有用户明确要求时才动"
```

## SKILL.md 触发描述（frontmatter description）

> Recreate the interactive ASCII "Creation of Adam" style hero/footer — a canvas that renders a user-supplied image as animated ASCII glyphs with cursor parallax, per-glyph tilt, and a gooey reveal disc. Trigger when the user asks for an ASCII image effect, ASCII portrait, ASCII hands, or "same effect as before, just swap the image".

## SKILL.md 执行步骤（写给未来的 agent）

1. **确认前置**：项目是 TanStack Start 模板；`lovable-assets` 在 PATH 上。若不是，停止并告知用户。
2. **拿到源图**：优先使用 `/mnt/user-uploads/` 下用户刚上传的图片；若用户没给，向用户询问一张图片。
3. **上传为 CDN 资源**：
   ```bash
   lovable-assets create --file <源图路径> --filename hands-pair.png \
     > src/assets/hands-pair.png.asset.json
   ```
   （保持文件名 `hands-pair.png.asset.json` 不变，这样组件里的 `import` 无需修改。）
4. **落地组件**：把 skill 里的 `assets/AsciiHandsFooter.tsx` 原样复制到 `src/components/AsciiHandsFooter.tsx`（parallel write，不做任何参数修改）。
5. **接入路由**：把 `references/route-template.tsx.txt` 内容写入 `src/routes/index.tsx`，其中的 `{{TITLE}}` / `{{DESCRIPTION}}` 用当前项目的语境替换（若用户没提，用 skill 内注释里的中性缺省文案）。
6. **构建校验**：`bun run build`；失败则先修复再收尾。
7. **收尾**：一句话告诉用户"已替换图片并复刻效果，其他参数保持不变"。若用户明确要求微调强度，才去改 `PARALLAX_MAX` / 每格深度乘子（引用 `tuning-notes.md` 里给出的当前值 13 与 `0.30 + bb*0.55 + c.armT*0.45`）。

## 关键不变量（写进 tuning-notes.md）

- 组件文件路径固定为 `src/components/AsciiHandsFooter.tsx`。
- 图片 asset 指针固定为 `src/assets/hands-pair.png.asset.json`（组件用 `@/` 别名引入）。
- 默认参数已经过多轮调校，属"锁定值"，不要在替换资源时顺手改动：
  - `PARALLAX_MAX = 13`
  - 每格深度：`0.30 + bb*0.55 + c.armT*0.45`
  - `FONT_PX = 8`，`CELL_W = CELL_H = 10`
  - `GOOEY_RADIUS_UV = 0.0376`，`GOOEY_SOFTNESS_UV = 0.023`，`GOOEY_NOISE = 0.018`
  - `ARM_ANGLE_DEG = 60`，`ARM_ALIGN_STRENGTH = 0.85`
  - `INTRO_DURATION_MS = 1600`
- 只有用户明确说"更强 / 更弱 / 更快"时才动这些值，并在改完后同步更新本 tuning-notes.md，让下一次复刻自动继承新缺省。

## 技术细节

- `AsciiHandsFooter.tsx` 内含 canvas 采样、arm-progress 计算、Gooey reveal 和 parallax 全部逻辑，与外部只通过一个 `handsPairAsset.url` 相连；因此**替换资源 = 替换 `.asset.json`**，组件零改动。
- 路由模板保留 head meta（title/description/og:*）以满足 SEO 硬性要求；og:image 留空（由发布平台自动生成），符合"leaf route only、非 root"的规则。
- Skill 通过 `skills--apply_draft .agents/skills/ascii-image-footer` 激活；之后在任意项目中，agent 检索到"ASCII image effect"类请求时会自动加载该 SKILL.md 并按上面的 7 步执行。

## 后续使用示意

未来用户在新项目里说"帮我做一个和上次一样的 ASCII 图片效果，图在这"→ agent 命中本 skill → 上传图 → 复制组件 → 写路由 → build → 完成，全过程无需再翻旧对话或手动调参。
