Plan: adjust the bottom chat dock (FinChatDock) parameters and text.

1. Update expanded state width
   - In `src/components/FinChatDock.tsx`, change `maxWidth: expanded ? 720 : 440` to `maxWidth: expanded ? 680 : 440`.

2. Update input text style
   - In the textarea element inside `FinChatDock.tsx`, change `fontSize: 15` to `fontSize: 14` and keep `lineHeight: "22px"`.

3. Switch text to English
   - Replace the three Chinese suggestion prompts in the `SUGGESTIONS` array with English equivalents.
   - Replace the textarea placeholder `"随便问什么…"` with `"Ask anything…"`.
   - Replace the footer text `"By chatting with us, you agree to our Privacy Policy"` — this is already English, so no change needed there.

Files to modify: `src/components/FinChatDock.tsx` only.

No new dependencies or database changes required.