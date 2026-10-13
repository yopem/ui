---
"@yopem-ui/cli": minor
---

feat(cli): add design system guidance options

Add design system guidance options to the CLI init command. Users can choose to
write guidance to DESIGN.md, update AGENTS.md, or skip this step. The guidance
includes semantic tokens, typography, spacing, and component usage. It ensures
alignment with the design system and preserves unmanaged content. Tests verify
correct behavior for all guidance options, dry runs, and invalid inputs.
