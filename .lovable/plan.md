## 目标

1. 调整手部与主体（标题）上下关系；2) 删除底部 "Good/Fella" 浅灰大字；3) 底部新增仿 fin.ai 的对话框组件。

## 1. 调整手部与主体的上下位置

现状：`AsciiHandsFooter` 的 canvas 占满 100vh，手部大约位于视口中部，`HeroCopy` 用 `paddingTop: 22vh` 从顶部落下，标题正好压在手掌区域上。

修改：

- 让手部作为"底部"存在（贴合 AsciiHandsFooter 命名）：在 `AsciiHandsFooter.tsx` 中把 canvas 从 `inset-0 h-full` 改为固定 `bottom-0 h-[72vh]`（保留 overflow-hidden），手掌自然沉到下半屏。
- `HeroCopy` 保持顶部区域，`paddingTop` 从 22vh 调整到约 16vh，让标题稳定落在上 1/3，与下半部的手部形成明确的上下分层，不再互相压叠。
- 不改任何交互逻辑（hover/click/mosaic/流动/视差都不动），只调容器尺寸与定位。

## 2. 调整底部浅灰 "Good/Fella" 文字

`文字调整为Synergy.AI`

## 3. 底部对话框（参考 fin.ai/drlp/fin-vs-sierra）

新建 `src/components/FinChatDock.tsx`，1:1 复刻参考站底部聊天面板的**视觉与前端交互**（不接后端；发送后本地追加消息 + 模拟 typing 回复占位，可后续接入 Lovable AI）。

结构（自下而上）：

- 底部固定容器：`fixed bottom-6 inset-x-0 z-30`，最大宽 720px 居中，`pointer-events-none`，内部子元素 `pointer-events-auto`。
- **建议问题气泡**（3 条，横向流出、错落排列，向上浮出淡入）：
  - "Fin 能为我做什么？"
  - "Fin 可以与我的帮助台集成吗？"
  - "Fin 能带来什么结果？"
  - 样式：深灰半透明 `bg-white/8 backdrop-blur`，圆角 20px，`px-4 py-2.5`，Montserrat 14/22，白字。点击 = 把问题写入输入框。
- **输入条**：白色圆角胶囊，高度 56，`rounded-full`，阴影 `shadow-[0_8px_32px_rgba(0,0,0,0.35)]`。
  - 左：`<input>` placeholder "随便问什么…"（Montserrat 15）
  - 右：三个图标按钮 —— mic（`lucide-react` Mic）、attach（Paperclip）、发送（圆形浅灰底 + ArrowUp，`h-9 w-9 rounded-full bg-neutral-200 hover:bg-neutral-300`）
- **底部一行细字**："By chatting with us, you agree to our Privacy Policy"，`text-xs text-white/40 text-center mt-3`。

交互（本地）：

- `messages: {role:'user'|'assistant', text}[]` state；发送时清空输入、追加用户消息、800ms 后 push 一条占位回复 "（演示回复）…"。
- 建议气泡在有过 1 条以上用户消息后隐藏。
- Enter 发送、Shift+Enter 允许换行（改用 textarea auto-resize，最大 3 行）。
- 键盘可达：`aria-label` 齐全，输入框自动 focus 逻辑仅在用户点击气泡后触发（避免抢滚轮）。

在 `src/routes/index.tsx` 中在 `<HeroCopy />` 后加 `<FinChatDock />`。

## 技术要点

- 不改 IntroVideo / ASCII canvas 内部逻辑，不动 SiteNav。
- 颜色/字体沿用现有 tokens 与 Montserrat 全局字体。
- FinChatDock 只使用 lucide-react（已装）+ Tailwind + 本地 state；无新依赖。
- 手部与聊天框的 z-order：canvas(z-10) < FinChatDock(z-30) < HeroCopy(z-30) < SiteNav(z-40)。聊天框固定在视口底部 24px，避免与手部指尖点击热区冲突（手部 canvas 只到 72vh，聊天框位于剩余空间下方）。

## 交付

- 修改 `src/components/AsciiHandsFooter.tsx`（canvas 尺寸调整 + 删除大字块）
- 修改 `src/components/HeroCopy.tsx`（paddingTop 调整）
- 新增 `src/components/FinChatDock.tsx`
- 修改 `src/routes/index.tsx`（挂载新组件）