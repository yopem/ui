---
"@yopem-ui/oxlint-plugin": minor
---

feat(oxlint): add no-unused-stylex-styles rule

Introduce `no-unused-stylex-styles` rule to detect unused top-level keys in
`stylex.create` declarations. Tracks lexical scope, import aliases, and dynamic
style functions. Skips exports, escaping objects, and declarations with spreads
or computed keys. Rule is opt-in and disabled by default.
