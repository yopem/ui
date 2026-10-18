# @yopem-ui/cli

## 0.4.0

### Minor Changes

- [`0282ae3`](https://github.com/yopem/ui/commit/0282ae35770a046970ae0dc2f6a7eaa3f6b5b55e)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(cli): add
  customizable source directories

  The CLI now supports optional directory customization for components, UI,
  hooks, libraries, styles, and themes. Users can set these paths interactively
  during `init` or programmatically via `ui.json`. Key changes include:

  - Added `paths` field in `ui.json` for directory overrides.
  - Default directories adapt to the presence of a `src` folder.
  - `sourceRoot` field tracks the import alias root (`src` or `.`).
  - Updated `init` to prompt for directory customization.
  - Ensured `add` and `update` commands respect configured paths.
  - Enhanced validation to prevent unsafe or conflicting paths.
  - Updated documentation and tests to reflect these changes.

## 0.3.0

### Minor Changes

- [`ed1a945`](https://github.com/yopem/ui/commit/ed1a945ab7bd3f8bc6ee0f17b0b60cf92e9e3a80)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(ui): add
  AspectRatio, List, Strong, and Figcaption

  - Added AspectRatio for divs with CSS aspectRatio. Default ratio is 16:9.
  - Introduced List and ListItem for semantic unordered and ordered lists.
  - Added Strong for marking important text with weight 600.
  - Introduced Figcaption for muted captions inside figures.
  - Updated documentation and examples for new components.
  - Adjusted lint rules and guidance to include new primitives.
  - Ensured accessibility and semantic correctness in tests.

### Patch Changes

- [`78bd55f`](https://github.com/yopem/ui/commit/78bd55fb0cb978bc64f65818d2340e0f4ec148a7)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(cli): update
  radius token values

  - Change radius token values to new defaults:
    - sm: 0.5rem (8px)
    - md: 0.75rem (12px)
    - lg: 1rem (16px)
    - xl: 1.5rem (24px)
  - Update guidance documentation to reflect new radius values.
  - Add note about rounded components using md (12px) by default.
  - Update tests to validate the new radius token values.

## 0.2.0

### Minor Changes

- [`889acef`](https://github.com/yopem/ui/commit/889acef174c7742d1f20416085f617c87a9b538d)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(cli): add
  design system guidance options

  Add design system guidance options to the CLI init command. Users can choose
  to write guidance to DESIGN.md, update AGENTS.md, or skip this step. The
  guidance includes semantic tokens, typography, spacing, and component usage.
  It ensures alignment with the design system and preserves unmanaged content.
  Tests verify correct behavior for all guidance options, dry runs, and invalid
  inputs.

  feat(typography): update font families for text and code

  - Replace Figtree with Inter for body text and headings.
  - Replace JetBrains Mono with IBM Plex Mono for code and mono text.
  - Update CSS and tokens to use the new font families.
  - Add tests to verify the updated font family usage.

## 0.1.4

### Patch Changes

- [`559f835`](https://github.com/yopem/ui/commit/559f835e60846dfd3e3d38c79b59420f58c83ebd)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - f

- [`50c40c1`](https://github.com/yopem/ui/commit/50c40c107eb04e870c2f1a3b0286697037506698)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(cli): add
  Node.js support and improve CLI compatibility

  The CLI now supports Node.js 22.20+ alongside Bun. It includes updates for
  compatibility with npm, pnpm, and Yarn. Key changes:

  - Updated README with usage examples for npm, pnpm, and Yarn.
  - Replaced Bun-specific APIs with Node.js-compatible alternatives.
  - Added `cross-spawn` and `semver` dependencies for process handling and
    version checks.
  - Modified `package.json` to build and publish Node.js-compatible output.
  - Introduced `build` and `prepack` scripts for Node.js builds.
  - Updated `bin` and `exports` fields to use `dist` directory.
  - Added `tsconfig.build.json` for TypeScript declaration generation.
  - Replaced Bun's `spawn` and `semver` with `cross-spawn` and `semver` library.
  - Added Node.js-specific tests in `node.test.ts` to verify CLI behavior.
  - Updated CLI commands to detect and use the appropriate package manager.
  - Improved error handling and compatibility for mixed environments.

  These changes ensure the CLI works seamlessly across different environments.

## 0.1.3

### Patch Changes

- [`feea63c`](https://github.com/yopem/ui/commit/feea63c423ee976cd75a8f3eac98f3a30f90ed27)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - chore: update
  README docs

- [`6ca39eb`](https://github.com/yopem/ui/commit/6ca39eb907044aaa9ce5f975ee282f97bd099513)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - refactor(cli):
  remove valid-polymorphic-as lint rule

  - Remove the "yopem-ui/valid-polymorphic-as" lint rule from lintRules.
  - Update related test cases to reflect the removal of the rule.
  - Replace instances of "valid-polymorphic-as" with alternative checks or
    remove them where no longer needed.
  - Adjust example code to align with the updated linting rules.

## 0.1.2

### Patch Changes

- [`5dd8b2e`](https://github.com/yopem/ui/commit/5dd8b2e31f3f6e58a45b25f1cc6d4a0b72193dfc)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - refactor(cli):
  optimize async operations with Promise.all

  Replaced sequential async calls with Promise.all for better performance and
  readability. Updated multiple functions across init, install, and project
  modules to use this approach.

## 0.1.1

### Patch Changes

- [`21b5e31`](https://github.com/yopem/ui/commit/21b5e315066f76a57efd685f8733e7bcdb3713a0)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - Skip
  package-manager commands when dependencies already satisfy registry
  requirements, preserve compatible dependency specs, and keep runtime
  dependency precedence across installer and init plans.

  Support `init --dry-run` for every supported framework and shared UI
  workspace, previewing validated file, configuration, manifest, and dependency
  changes without writing files or running a package manager.

  Track registry URLs and item versions in backward-compatible `ui.json`
  manifests and warn before applying files from a different known registry while
  preserving provenance for skipped files.

  Reject registry redirects, including injected redirect responses, without
  exposing response bodies, credentials, or redirect destinations in errors.

## 0.1.0

### Minor Changes

- [`abafbe8`](https://github.com/yopem/ui/commit/abafbe87959c0ea60a98049e6480bd1b65110ba7)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - feat(cli): add
  monorepo support for shared UI packages

  Introduce `--ui` flag to `init` for shared UI setup in monorepos. Adds source
  exports, workspace dependencies, and StyleX configuration.

  feat(cli): register shared imports with Oxlint rules

  Updated `init` to register shared package imports with Yopem UI Oxlint rules,
  preserving existing options and opt-outs. Adjusted lint config to include
  shared sources dynamically. Removed redundant e2e test.

  fix(cli): verify production builds and normalize Vite aliases (`a55d473`)

  Add packed CLI production smoke tests for Vite and Next.js, both standalone
  and with shared UI packages. Verify HTML, JavaScript, and extracted StyleX
  CSS. Normalize relative `@` aliases to the configured source path so
  production builds resolve copied components correctly.

  fix(cli): roll back failed file writes and track installs in ui.json
  (`c6b0d3d`)

  Stage source, configuration, and tracking changes before applying writes.
  Recheck file contents and symlinks, preserve file modes, and restore committed
  files when a write fails. Include retired configuration files and Next.js
  scripts in the configuration transaction. Package-manager changes and a prior
  successful base installation are not rolled back.

  Rename the tracking file from `.yopem-ui.json` to `ui.json`. Existing users
  should rename their tracking file before running `add` or `update` to retain
  installed-file hashes and shared import prefixes.

  feat(cli): support secure registry overrides and request deadlines (`b7e0bab`)

  Default to `https://ui.yopem.com/r`. Add `--registry <URL>` to `init`, `add`,
  and `update`, plus programmatic `registryUrl` and `requestTimeoutMs` options.
  Overrides apply only to the current command. Require HTTPS except for local
  HTTP development; reject credentials, query strings, and fragments. Bound
  connection and JSON body reads to 30 seconds by default, with actionable
  network, timeout, HTTP, and malformed JSON errors before installation changes.

  feat(cli): add help and version discovery commands (`4589908`)

  Support `--help`/`-h`, `--version`/`-v`, and usage output when no arguments
  are provided. Discovery commands work without a project and exit successfully;
  invalid arguments exit with status 1. Read the version from CLI package
  metadata rather than duplicating it in source.

  feat(cli): preview add and update without writes (`03b53bc`)

  Add `--dry-run` and programmatic `dryRun` support for `add` and `update`.
  Preview file writes, skips, all local conflicts, forced overwrites, and
  runtime and development dependency requests using the same installation
  preflight. Registry validation still runs, but previews create no files or
  directories, change no tracking or configuration, and never invoke a package
  manager. Reject dry runs for `init` before changes. Verify packed help/version
  and mutation-free previews alongside production build workflows.

## 0.0.2

### Patch Changes

- [`723ba50`](https://github.com/yopem/ui/commit/723ba502fa98e8a47e9ee7b9bd9f710c3c0e896c)
  Thanks [@karyanayandi](https://github.com/karyanayandi)! - Prepare CLI and
  Oxlint plugin for automated npm releases.
