Plan: Remove the remaining center copy text and its now-empty wrapper from `src/components/AsciiHandsFooter.tsx`.

What to change:
- Delete the entire center copy block (lines 331–347), including the `{/* Center copy */}` comment, the outer `pointer-events-none` wrapper div, the inner styled `text-center` div, and the two remaining lines:
  - `<p>Good Fella Studio GmbH.</p>`
  - `<p>Let the Fellas handle it.</p>`
- After removal, the ASCII canvas `<canvas />` element will remain directly inside the `<section>`.

Verification:
- Run the build/typecheck to ensure no syntax errors after removing the block.
- Confirm the footer renders only the ASCII hands effect without any overlaid center text.

No other changes to the ASCII effect, image asset, colors, layout, or cursor interaction.