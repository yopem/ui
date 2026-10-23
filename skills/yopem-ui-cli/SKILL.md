---
name: yopem-ui-cli
description: >-
  Install, add, and update Yopem UI source with @yopem-ui/cli using Bun, npm,
  pnpm, or Yarn 2 and later. Use when initializing StyleX in supported React
  projects, configuring shared UI workspaces, selecting AGENTS.md or DESIGN.md
  guidance, previewing changes, resolving registry or ui.json conflicts, or
  protecting local component edits during updates.
---

# Yopem UI CLI

## Inspect before running commands

Read the project's instructions, `package.json`, lockfile, TypeScript settings,
framework configuration, and `ui.json` when present. Identify the target app and
any shared UI package. Check for local edits before source updates.

Init configures an existing React TypeScript project. It does not create an app.
Use React 19 for the complete component set. Check item peer requirements when
working with an older project.

Supported frameworks:

- Vite React and client TanStack Router.
- TanStack Start.
- React Router in client or framework mode, not RSC mode.
- Next.js App Router with webpack, not Pages Router or Turbopack.
- Astro with React integration.

The Node launcher requires Node `>=22.20.0`. Next.js setup requires Node 24 or
later. Consult the
[installation guide](https://ui.yopem.com/docs/installation.md) for framework
prerequisites and root entry files.

## Choose one package manager

Bun, npm, pnpm, and Yarn 2 or later are supported. Bun is not required for npm,
pnpm, or Yarn projects. Those launchers use Node.

Use the project's package manager. Each command block shows alternatives for all
four managers. Run only the matching command or manager group:

```sh
bunx --bun @yopem-ui/cli --help
npx @yopem-ui/cli --help
pnpm dlx @yopem-ui/cli --help
yarn dlx @yopem-ui/cli --help
```

The launcher and dependency installer are separate. The CLI selects the
installer from the target package's `packageManager` field and lockfiles. In a
workspace, it also checks the workspace root. These declarations must agree.

Without a declaration or lockfile, the CLI uses the launcher environment, then
the runtime. Keep the intended package manager explicit in the project. Do not
create a Bun lockfile in an npm, pnpm, or Yarn project.

The CLI uses the selected manager for runtime and development dependencies. It
maps npm dependency commands to `install` and development flags to `-D`. Shared
workspace references also use the selected manager's syntax.

## Install the rich-text editor

Initialize StyleX before you add the editor. Use the matching package manager:

```sh
bunx --bun @yopem-ui/cli add editor
npx @yopem-ui/cli add editor
pnpm dlx @yopem-ui/cli add editor
yarn dlx @yopem-ui/cli add editor
```

The registry item copies Lexical editor source and its UI dependencies. Use
Lexical JSON for document state. Do not pass Slate documents or Plate plugins.
Read the [editor guide](https://ui.yopem.com/docs/editor.md) for supported
features.

### Editor composition

Install the `editor` item before you use either the preset or public parts. The
same installation copies all composition source files and UI dependencies.
Import `Editor` from `@/components/editor` for the preset. Import `EditorRoot`,
`EditorToolbar`, and `EditorContent` from the same copied source for custom UI.
Keep each toolbar and surface inside one root. Each root keeps separate history
and document state. Root `ariaLabel` and `editable` apply to its content.

```tsx
"use client"

import {
  EditorRoot,
  EditorContent,
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockButton,
} from "@/components/editor"

export function ComposedNotes() {
  return (
    <EditorRoot ariaLabel="Composed editor">
      <EditorToolbar aria-label="Custom formatting">
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
        <EditorBlockButton block="h2" />
      </EditorToolbar>
      <EditorContent placeholder="Write your notes…" />
    </EditorRoot>
  )
}
```

Add `EditorListButton`, `EditorIndentButton`, `EditorLinkControl`, or
`EditorTableButton` when needed. Use `useEditor` for Lexical commands and
`useEditorState` for text formats and history availability inside the root.
Preserve keyboard behavior, URL validation, read-only state, refs, and consumer
props. This API does not accept Slate documents or Plate plugins.

The same installation provides `EditorTableMenu` for row, column, header, merge,
and split actions. Register `EditorTablePresentationExtension` for bounded
tables and persisted cell presentation. Compose `EditorTableDimensions`,
`EditorTableCellPresentation`, and `EditorTableResizeControls` inside
`EditorRoot`. Keep `data-editor-row-height` in exported HTML to preserve finite
native heights. Keep table scrolling bounded and keyboard-accessible. Validate
external table JSON and HTML before conversion. Invalid updates must preserve
existing content. Discard saved table selections after document changes.
Preserve resize cancellation, history, and right-to-left keyboard behavior.

### Optional editor authentication

Install server helpers with the matching package manager:

```sh
bunx --bun @yopem-ui/cli add editor-auth
npx @yopem-ui/cli add editor-auth
pnpm dlx @yopem-ui/cli add editor-auth
yarn dlx @yopem-ui/cli add editor-auth
```

The item copies helpers into the configured library directory. Its default
import is `@/lib/editor-auth`. Keep it out of browser components. Connect an
existing OpenAuth or Better Auth service. OpenAuth requires an explicit
audience; its default issuer is `https://auth.yopem.com`. Better Auth receives
the host session getter without session refresh. Both adapters supply verified
`credentialExpiresAt` in Unix epoch milliseconds. Require verified expiry for
collaboration tickets. Require separate document authorization and host route
origin and CSRF checks. These helpers do not create accounts or deploy services.

## Initialize safely

Preview first:

```sh
bunx --bun @yopem-ui/cli init --dry-run
npx @yopem-ui/cli init --dry-run
pnpm dlx @yopem-ui/cli init --dry-run
yarn dlx @yopem-ui/cli init --dry-run
```

Review target paths, build changes, dependencies, prerequisites, and conflicts.
Then apply:

```sh
bunx --bun @yopem-ui/cli init
npx @yopem-ui/cli init
pnpm dlx @yopem-ui/cli init
yarn dlx @yopem-ui/cli init
```

Init installs tokens, reset CSS, and StyleX helpers. It configures aliases,
build extraction, root styles, Oxlint, and the Yopem plugin. It does not install
all components, theme switching, or fonts.

Init can migrate supported Babel or PostCSS configuration and remove old config
files. Next.js setup can change dev/build scripts to webpack. Inspect the full
diff, not only copied components. Resolve unsupported configuration manually; do
not delete custom settings to bypass a conflict.

When multiple supported frameworks are detected, select one:

```sh
bunx --bun @yopem-ui/cli init --framework tanstack-start --dry-run
npx @yopem-ui/cli init --framework tanstack-start --dry-run
pnpm dlx @yopem-ui/cli init --framework tanstack-start --dry-run
yarn dlx @yopem-ui/cli init --framework tanstack-start --dry-run
```

Valid values are `vite`, `tanstack-router`, `tanstack-start`, `react-router`,
`next`, and `astro`. The selected framework must exist in the project.

### Optional agent guidance

Choose one destination only when the user requests guidance:

```sh
bunx --bun @yopem-ui/cli init --guidance agents
npx @yopem-ui/cli init --guidance agents
pnpm dlx @yopem-ui/cli init --guidance agents
yarn dlx @yopem-ui/cli init --guidance agents
```

This example updates `AGENTS.md`. Use the value `design` to write `DESIGN.md`,
or `none` to write neither. Interactive init offers this choice. Noninteractive
init defaults to neither. Guidance belongs to the target app, including shared
UI setups.

Init preserves content outside the Yopem managed block. Rerun the same option to
refresh that block. Resolve malformed markers before retrying. Do not write both
files or replace unrelated project instructions.

## Add and update source

Install one item per command:

```sh
# Bun
bunx --bun @yopem-ui/cli add button --dry-run
bunx --bun @yopem-ui/cli add button

# npm
npx @yopem-ui/cli add button --dry-run
npx @yopem-ui/cli add button

# pnpm
pnpm dlx @yopem-ui/cli add button --dry-run
pnpm dlx @yopem-ui/cli add button

# Yarn 2 and later
yarn dlx @yopem-ui/cli add button --dry-run
yarn dlx @yopem-ui/cli add button
```

Registry dependencies are included. Read the copied exports and component docs
before writing imports. Use the `yopem-ui` skill for component composition.

Preview an update before applying it:

```sh
# Bun
bunx --bun @yopem-ui/cli update button --dry-run
bunx --bun @yopem-ui/cli update button

# npm
npx @yopem-ui/cli update button --dry-run
npx @yopem-ui/cli update button

# pnpm
pnpm dlx @yopem-ui/cli update button --dry-run
pnpm dlx @yopem-ui/cli update button

# Yarn 2 and later
yarn dlx @yopem-ui/cli update button --dry-run
yarn dlx @yopem-ui/cli update button
```

Updates can reach transitive and shared files. Inspect all affected files. `add`
skips locally modified tracked files; `update` refuses them unless forced. Use
`update`, not repeated `add`, to refresh existing tracked source.

**Do not use `--force` without explicit approval to replace local source.** Back
up or commit edits first. Compare the incoming source with local changes. Force
can overwrite modified tracked files and conflicting untracked files. It does
not bypass registry or path validation. Init does not accept force.

For theme switching, add the separate item:

```sh
bunx --bun @yopem-ui/cli add theme
npx @yopem-ui/cli add theme
pnpm dlx @yopem-ui/cli add theme
yarn dlx @yopem-ui/cli add theme
```

Root wiring remains manual. Follow the theming guide and the `yopem-ui` skill.

## Select source directories

Interactive init offers optional directory customization. Press Enter to keep
detected defaults. Choose yes to set each directory. Noninteractive init keeps
detected defaults without a prompt.

Init uses `src/` defaults only when the target project has a `src` directory.
Without `src`, defaults are `components`, `components/ui`, `hooks`, `lib`,
`styles`, and `themes`. Shared init checks the UI package, not the app.

Init saves choices in `ui.json`. You can also set `paths` before init:

```json
{
  "version": 1,
  "files": {},
  "paths": {
    "components": "src/components",
    "ui": "src/design-system/ui",
    "hooks": "src/shared/hooks",
    "lib": "src/lib",
    "styles": "src/styles",
    "theme": "src/themes"
  }
}
```

Paths are project-relative directories with forward slashes. Missing keys keep
their defaults. The default UI directory is `src/components/ui`. The `ui` key is
independent of `components`. Preserve existing manifest tracking fields. The
`sourceRoot` field records the import alias root: `src` or `.`. Existing tracked
layouts keep their paths, including the earlier `src/theme` directory.

Init configures base files and build settings for these paths. Add and update
use them for file destinations and copied imports. For shared workspaces, edit
the UI package's `ui.json`. Paths must stay inside the project. Directories can
overlap. The CLI rejects file destination conflicts.

Set each path before you install files in that directory. The CLI rejects
changed destinations for tracked files. It does not move existing source files.

## Use a shared workspace

Create a named UI package in the same workspace before init. From the workspace
root, preview this example:

```sh
bunx --bun @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui --dry-run
npx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui --dry-run
pnpm dlx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui --dry-run
yarn dlx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui --dry-run
```

`--ui` resolves relative to the target app, not the shell directory. After
review, apply and target the shared package for component operations:

```sh
# Bun
bunx --bun @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui
bunx --bun @yopem-ui/cli add button --cwd packages/ui
bunx --bun @yopem-ui/cli update button --cwd packages/ui --dry-run

# npm
npx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui
npx @yopem-ui/cli add button --cwd packages/ui
npx @yopem-ui/cli update button --cwd packages/ui --dry-run

# pnpm
pnpm dlx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui
pnpm dlx @yopem-ui/cli add button --cwd packages/ui
pnpm dlx @yopem-ui/cli update button --cwd packages/ui --dry-run

# Yarn 2 and later
yarn dlx @yopem-ui/cli init --cwd apps/web --ui ../../packages/ui
yarn dlx @yopem-ui/cli add button --cwd packages/ui
yarn dlx @yopem-ui/cli update button --cwd packages/ui --dry-run
```

Init adds source exports, links the app, and configures extraction for both
packages. Next.js also receives `transpilePackages`. Import components through
the shared package name, such as `@acme/ui/components/ui/button`.

Run shared init for each consuming app. Repeat `--ui` when rerunning init. Do
not assume existing app-local components move into the shared package.

## Handle registries and manifests

The default registry is `https://ui.yopem.com/r`. Select another trusted
registry for one command:

```sh
bunx --bun @yopem-ui/cli add button --registry https://example.com/r --dry-run
npx @yopem-ui/cli add button --registry https://example.com/r --dry-run
pnpm dlx @yopem-ui/cli add button --registry https://example.com/r --dry-run
yarn dlx @yopem-ui/cli add button --registry https://example.com/r --dry-run
```

Use HTTPS, except for local HTTP. Registry URLs cannot contain credentials,
query strings, or fragments. Redirects are rejected. Do not bypass these checks.

Registry selection is command-local. `ui.json` records file hashes, item
versions, and registry provenance; it does not pin future commands to a
registry. A registry-switch warning does not authenticate a publisher. Review
the source.

Keep `ui.json` with the copied source. Do not erase it to bypass update
conflicts. Skipped files retain their original provenance. The CLI supports
legacy version-1 manifests.

## Troubleshoot and verify

- Use standalone `--help` or `--version`; do not use `init --help`.
- Put flags after the command. Separate flag names and values with spaces.
- Do not use bulk item names, item URLs, unknown flags, or duplicate flags.
- Use `--framework`, `--ui`, and `--guidance` only with init.
- Use `--force` only with add or update, after approval.
- Fix conflicting package-manager declarations or lockfiles before retrying.
- Resolve incompatible aliases and dynamic build configuration explicitly.
- Rerun a dry run after changing project or registry state.

Dry runs fetch and validate registry data but do not write files or run a
package manager. They do not reserve remote content or guarantee a later apply
succeeds. Do not assume complete rollback after failure: package-manager effects
can remain, and init can retain an earlier base installation. Inspect the diff
and manifest.

After applying, inspect source, config, manifest, dependency, and lockfile
changes. Run the project's lint, format, typecheck, and production build
commands. Exercise the affected UI workflow. Use `yopem-ui-oxlint` for lint
configuration details. Report unresolved conflicts and checks that could not
run.

See the [CLI guide](https://ui.yopem.com/docs/cli.md) for current behavior.

## Editor document storage

Use the separate `editor-store` server library for D1 or PostgreSQL snapshots.
Apply one copied SQL migration before use. Supply existing authentication,
complete Lexical validation, and host document policies, including deletion. Use
exact trusted origins and host CSRF verification for HTTP writes. Keep operation
IDs and preconditions unchanged when a write result is uncertain. Do not add
accounts, ACL tables, or implicit document grants. See
https://ui.yopem.com/docs/editor-store for protocol and deployment limits.

HTTP callbacks receive cancellation through `Request.signal`. Storage checks
deadlines before driver calls. Synchronous work cannot be stopped.

## Editor style composition

Import editor parts from `@/components/editor` after editor installation. Keep
style controls inside `EditorRoot` and `EditorToolbar`. Use
`EditorAlignmentButton`, `EditorFontColorControl`,
`EditorBackgroundColorControl`, `EditorFontFamilyControl`,
`EditorFontSizeControl`, and `EditorFontWeightControl` for text presentation.
Use `EditorLineHeightControl` and `EditorFirstLineIndentControl` for block
styles. Keep `EditorIndentButton` for block indentation.

Register `EditorBlockPresentationExtension` in a stable mount-time extension
array, including read-only roots. Import pure codecs from
`@/components/editor/block-presentation` for server use. Pass only the
`editorBlockPresentation` NodeState payload to `parseEditorBlockPresentation`.
Line height accepts unitless 1 through 4. First-line indentation accepts
nonnegative values through 160px or 10em/rem. JSON and HTML preserve validated
values. Keep host HTML sanitization and native conversion hooks.

Use `EditorClearFormattingButton` to remove presentation. Keep content, links,
list nesting, table structure, and unrelated NodeState. Saved style selections
expire after document changes. See
[editor composition](https://ui.yopem.com/docs/editor.md).
