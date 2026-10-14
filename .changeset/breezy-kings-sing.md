---
"@yopem-ui/cli": minor
---

feat(cli): add design system guidance options

Add design system guidance options to the CLI init command. Users can choose to
write guidance to DESIGN.md, update AGENTS.md, or skip this step. The guidance
includes semantic tokens, typography, spacing, and component usage. It ensures
alignment with the design system and preserves unmanaged content. Tests verify
correct behavior for all guidance options, dry runs, and invalid inputs.

feat(typography): update font families for text and code

- Replace Figtree with Inter for body text and headings.
- Replace JetBrains Mono with IBM Plex Mono for code and mono text.
- Update CSS and tokens to use the new font families.
- Add tests to verify the updated font family usage.
