---
"@yopem-ui/cli": minor
---

feat(cli): add monorepo support for shared UI packages

Introduce `--ui` flag to `init` for shared UI setup in monorepos. Adds source
exports, workspace dependencies, and StyleX configuration.

feat(cli): register shared imports with Oxlint rules

Updated `init` to register shared package imports with Yopem UI Oxlint rules,
preserving existing options and opt-outs. Adjusted lint config to include shared
sources dynamically. Removed redundant e2e test.
