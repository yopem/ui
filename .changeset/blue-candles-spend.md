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

fix(cli): verify production builds and normalize Vite aliases (`a55d473`)

Add packed CLI production smoke tests for Vite and Next.js, both standalone and
with shared UI packages. Verify HTML, JavaScript, and extracted StyleX CSS.
Normalize relative `@` aliases to the configured source path so production
builds resolve copied components correctly.

fix(cli): roll back failed file writes and track installs in ui.json (`c6b0d3d`)

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
Overrides apply only to the current command. Require HTTPS except for local HTTP
development; reject credentials, query strings, and fragments. Bound connection
and JSON body reads to 30 seconds by default, with actionable network, timeout,
HTTP, and malformed JSON errors before installation changes.

feat(cli): add help and version discovery commands (`4589908`)

Support `--help`/`-h`, `--version`/`-v`, and usage output when no arguments are
provided. Discovery commands work without a project and exit successfully;
invalid arguments exit with status 1. Read the version from CLI package metadata
rather than duplicating it in source.

feat(cli): preview add and update without writes (`03b53bc`)

Add `--dry-run` and programmatic `dryRun` support for `add` and `update`.
Preview file writes, skips, all local conflicts, forced overwrites, and runtime
and development dependency requests using the same installation preflight.
Registry validation still runs, but previews create no files or directories,
change no tracking or configuration, and never invoke a package manager. Reject
dry runs for `init` before changes. Verify packed help/version and mutation-free
previews alongside production build workflows.
