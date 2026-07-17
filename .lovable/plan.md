Plan: Remove the middle copyright-year line from the footer center copy in `src/components/AsciiHandsFooter.tsx`.

What to change:
- In the center copy block (lines 331–347), delete the line `<p>© 2026</p>`.
- The remaining lines will be:
  - `<p>Good Fella Studio GmbH.</p>`
  - `<p>Let the Fellas handle it.</p>`

Verification:
- Run the build/typecheck to ensure no syntax errors after removing the line.
- Confirm the footer still renders the two remaining lines without the year line.

No other changes to the ASCII effect, image asset, colors, or layout.