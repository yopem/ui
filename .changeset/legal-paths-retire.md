---
"@yopem-ui/cli": minor
---

feat(cli): add customizable source directories

The CLI now supports optional directory customization for components, UI, hooks,
libraries, styles, and themes. Users can set these paths interactively during
`init` or programmatically via `ui.json`. Key changes include:

- Added `paths` field in `ui.json` for directory overrides.
- Default directories adapt to the presence of a `src` folder.
- `sourceRoot` field tracks the import alias root (`src` or `.`).
- Updated `init` to prompt for directory customization.
- Ensured `add` and `update` commands respect configured paths.
- Enhanced validation to prevent unsafe or conflicting paths.
- Updated documentation and tests to reflect these changes.
