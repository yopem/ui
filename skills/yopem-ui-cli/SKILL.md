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

### Optional editor blocks

Install optional callout and toggle source with the matching package manager:

```sh
bunx --bun @yopem-ui/cli add editor-blocks
npx @yopem-ui/cli add editor-blocks
pnpm dlx @yopem-ui/cli add editor-blocks
yarn dlx @yopem-ui/cli add editor-blocks
```

The item includes `editor` as a registry dependency. Register
`EditorBlocksExtension` from `@/components/editor/blocks` in a stable extension
array. Compose focused controls inside `EditorToolbar`. Import server-safe
models from `@/components/editor/blocks-model`. Validate block JSON and HTML
before document replacement. Reject unsupported content without changing the
current document. Read-only disclosure changes local visibility, not saved state
or history. Keep rich toggle titles outside the native summary control. Keep
title links usable when closed. Keep the native details body, empty disclosure
control, and content slot together.

### Editor composition

Install the `editor` item before you use either the preset or public parts. The
same installation copies all composition source files and UI dependencies. Core
editing links plain URLs and email addresses with native `AutoLinkNode`. Code
stays inert. Register `AutoLinkNode` in custom readers of core editor JSON.

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

Configure `disableMerge:true` on `EditorTablePresentationExtension` at mount
time to block house merge actions. Existing spans remain. Explicit splitting
stays available. Native host mutations bypass this policy.

### Optional native code editing

```sh
bunx --bun @yopem-ui/cli add editor-code
npx @yopem-ui/cli add editor-code
pnpm dlx @yopem-ui/cli add editor-code
yarn dlx @yopem-ui/cli add editor-code
```

Import parts from `@/components/editor/code`, or the configured shared editor
path. Register `EditorCodeExtension` when you create `EditorRoot`. Keep
`EditorContent` as the editable surface. Do not replace native code nodes with
Codeblock. Put `EditorCodeLanguage`, `EditorCodeCopyButton`, `EditorCodeToggle`,
and `EditorCodeStatus` inside `EditorCodeToolbar`. Select one code block before
using its controls. Copy can run read-only; mutation cannot. Line numbers and
wrapping turn each other off. Lexical JSON preserves these choices. Keep native
code keyboard behavior and serializers. Discard saved targets after host
document changes.

Base editor-code does not require Prettier. Supply an `EditorCodeFormatter` for
formatting controls. Without a formatter, the preset hides these controls.
Install the separate adapter only when you want Prettier formatting:

```sh
bunx --bun @yopem-ui/cli add editor-code-format
npx @yopem-ui/cli add editor-code-format
pnpm dlx @yopem-ui/cli add editor-code-format
yarn dlx @yopem-ui/cli add editor-code-format
```

Import `prettierEditorCodeFormatter` from `@/components/editor/code-format`.
Pass it through the `formatter` prop. Syntax colors support more languages than
this adapter can format. Cancellation cannot stop synchronous parsing. The
adapter does not change your repository formatter.

### Optional editor review

```sh
bunx --bun @yopem-ui/cli add editor-review
npx @yopem-ui/cli add editor-review
pnpm dlx @yopem-ui/cli add editor-review
yarn dlx @yopem-ui/cli add editor-review
```

Import `EditorReviewPreset` and `EditorReviewHost` from
`@/components/editor/review`, or use the configured shared editor path. The
preset supplies its own root and editable surface. For custom composition,
create one controller per root and add its extension to the stable root
extension list. Place `EditorReviewProvider` inside `EditorRoot`.

Set `viewer` from a verified host identity. Supply a synchronous `can` policy.
Allow an action only when current policy returns literal `true`. Serialized
author IDs do not grant access. Check each action again on the server before
saving. `visible=false` hides review UI. It does not redact or delete state.

Review state uses root NodeState `yopemReview`, pending tree state
`yopemReviewStructural`, and text NodeState `yopemSuggestion`. Validate imported
state with `parseReviewDocument`. Register `MarkNode` in every reader that loads
review state. Untrusted input loses review metadata. Trust it only after host
verification.

Text diffs support one paragraph, 2048 graphemes, and 4096 UTF-16 units. Call
`$suggestDocumentTree` inside an editor update for one bounded tree proposal.
Resolve inline suggestions first. Tree proposals allow 128 KiB, 1024 nodes,
depth 24, and 128 changes. Call `decideStructural` outside Lexical read and
update contexts. Pending edits, changed documents, and ambiguous comment anchors
reject before replacement. Use `$suggestCompletedText` inside an update for
single-line output up to 16384 UTF-16 units. Suggestion creation and acceptance
are separate actions. Authorize document writes separately. Compose the
structural proposal, change-list, and decision parts. Use
`parseReviewDocument(value, trusted, true)` for structural-review IO. Trust
metadata only after host verification. Runtime validation remains deferred.
Paste inserts plain text only. Rich HTML paste is rejected. Pasted review
metadata is not preserved. `editor-document` does not import review formats. See
https://ui.yopem.com/components/editor-review for public contracts and limits.

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
complete Lexical validation, and host document policies, including deletion.
Keep snapshots within 1 MiB, 131072 JSON values, and 64 nested objects or
arrays. Use exact trusted origins and host CSRF verification for HTTP writes.
Keep operation IDs, preconditions, authentication provider, and user ID
unchanged on uncertain retries. Do not add accounts, ACL tables, or implicit
document grants. See https://ui.yopem.com/docs/editor-store for protocol and
deployment limits.

HTTP callbacks receive cancellation through `Request.signal`. Storage checks
deadlines before driver calls. PostgreSQL checks remaining time before each
statement. Synchronous work cannot be stopped.

## Editor collaboration

Use separate `add` calls for each required item. Add `editor-collaboration` for
browser parts and `editor-collaboration-server` for generic server helpers. Add
only the matching runtime item: `editor-collaboration-worker`,
`editor-collaboration-bun`, or `editor-collaboration-node`. Do not combine item
names in one CLI command. Use one package-manager switcher block per item in
consumer docs.

Import browser parts from `@/components/editor/collaboration` and generic server
helpers from `@/lib/editor-collaboration`. Import adapters directly from
`@/lib/editor-collaboration/collaboration-do`,
`@/lib/editor-collaboration/collaboration-bun`, and
`@/lib/editor-collaboration/collaboration-node`. Keep these entries out of
browser and generic server barrels.

The Bun adapter returns handlers for `Bun.serve` and supports host TLS. The Node
adapter uses `node:http`; bind it privately behind a trusted HTTPS/WSS proxy.
Hosts still supply verified authentication expiry, an exact HTTPS origin, CSRF
checks, literal-true document policies, real SQL transactions, and a
schema-complete initializer.

Keep binary document frames and bounded text readiness, delivery, and ACK
controls. Recipient rechecks do not make revocation atomic with database writes.
History has a fixed bound and no automatic compaction. Do not replay uncertain
offline drafts. Do not claim runtime or deployment validation from source
publication. See https://ui.yopem.com/docs/editor-collaboration.

### Native collaboration grants

Install `editor-collaboration-grants` in a separate one-item command:

```sh
bunx --bun @yopem-ui/cli add editor-collaboration-grants
npx @yopem-ui/cli add editor-collaboration-grants
pnpm dlx @yopem-ui/cli add editor-collaboration-grants
yarn dlx @yopem-ui/cli add editor-collaboration-grants
```

This server-only item copies `collaboration-native-grants.ts` and
`collaboration-native-model.ts` under `@/lib/editor-collaboration`. It depends
on `editor-auth`, `editor-store`, and manifest-derived `zod`. It does not
install native collaboration SDKs.

Use `createEditorNativeGrantsHttpHandler` on the server. Configure one exact
trusted HTTPS origin and POST path. Require the exact `Origin` header, existing
authentication with verified `credentialExpiresAt`, CSRF approval, and literal
`true` from the current room policy. Preserve opaque `userId` bytes.

The handler reads one bounded request body. It gives callbacks isolated copies
of the exact bytes. The provision callback receives a bounded copy of the
current request, signal, and deadline. Noncooperative callbacks keep capacity
until they settle.

Provision the authoritative room seed once. Bind each grant to the exact room,
generation, permission, and identity. Keep expiry within five minutes and at or
below `maximumCredentialExpiresAt`. Verify Hocuspocus credentials against
current host state. Returned `seeded` metadata does not prove durable seeding or
scope enforcement.

Issue peer credentials only to writers. Configure trusted WSS signaling and a
nine-peer limit. Native Hocuspocus and WebRTC provide no `editor-v1` ACKs,
per-frame host authorization, atomic revocation, or durability proof from sync.
No account, ACL, endpoint, model, or token service is included.

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

## Editor AI proposals

Install optional `editor-ai` server source separately from `editor` client
source. Import server helpers from `@/lib/editor-ai`. Never import them into
browser code. Compose `EditorAiRoot`, `EditorAiTrigger`, and `EditorAiPanel`
inside `EditorRoot`. Supply an explicit same-origin endpoint, documentId, and
current host authentication and CSRF headers. Without configuration, AI controls
render nothing. No default endpoint or model exists. Review progressive
untrusted plain text. Approval requires explicit completion and clean EOF.
Content, format, style, non-null selection, and read-only changes invalidate
proposals. A null selection retains the saved target for dialog use. Remount
EditorAiRoot when host code discards the saved target. Approval makes one local
history update. Authorize document writes separately. Supply existing OpenAuth
or Better Auth, verified expiry, exact HTTPS Origin, CSRF verification, and
durable host quota. Require literal true from the document policy for
`ai:invoke`. This permission never grants `document:write`. Keep provider
credentials and model selection on the server. Never retry paid requests
automatically. Keep tokens out of browser storage, URLs, and logs. Cancellation
does not prove that billing stops. See https://ui.yopem.com/docs/editor-ai for
provider schema and deployment limits.

## Optional editor typeahead

Install `editor-typeahead` separately. Import optional parts from the copied
editor `typeahead-index` module. Create one stable controller per root. Keep its
extension and custom command arrays stable at mount time. Render
`EditorTypeahead` inside that root. Compose `EditorEmojiMenu` inside
EditorToolbar for search. Supply a bounded, abort-aware host mention loader.
Missing loaders disable mentions. The controller registers `MentionNode` only
when `mentions.load` is set. Keep mention options fixed for each root. Register
`MentionNode` in every document reader. Use the pure `mention-codec` helpers for
IO validation. Serialized identities do not grant access. Register Markdown
conversion explicitly and keep host HTML sanitization. Use the full English
emojibase-data inventory or validated host emoji graphemes. Search returns at
most 50 results per page. Use category and page controls to browse the
inventory. Validate host lists with `parseEditorEmojiInventory`. Pass
`controller.emojiHistory` to the picker to share bounded memory counts. No
automatic storage is included. See
https://ui.yopem.com/components/editor-typeahead for public contracts and
limits.

Use EditorInlineCombobox with Input, Content, List, Item, Empty, Status, Group,
GroupLabel, and Row parts. EditorInlineComboboxInput renders EditorContent. Do
not add a second query input. Keep every current item in controller order. Read
state with useEditorInlineCombobox. Compose EditorEmojiPopover,
EditorEmojiToolbarButton, EditorEmojiPopoverContent, and EditorEmojiPicker
inside EditorToolbar. EditorEmojiPicker is the panel. EditorEmojiMenu is the
complete toolbar preset. Compose EditorEmojiSearch, EditorEmojiCategory,
EditorEmojiList, EditorEmojiItem, EditorEmojiEmpty, EditorEmojiPrevious,
EditorEmojiNext, and EditorEmojiClearHistory. Read picker state with
useEditorEmojiPicker. Keep inventory, filter, and history stable until unmount.
Keep inline and emoji options at least 44px high for coarse pointers.
EditorTypeahead renders the editable surface and suggestions. Do not add
EditorContent beside this preset.

## Optional editor document conversion

Install `editor-document` for JSON, HTML, Markdown, and static output. This item
installs `editor` and `editor-blocks`. Base editor installs exclude these
codecs.

```sh
bunx --bun @yopem-ui/cli add editor-document
npx @yopem-ui/cli add editor-document
pnpm dlx @yopem-ui/cli add editor-document
yarn dlx @yopem-ui/cli add editor-document
```

Import portable helpers from `@/components/editor/document`. Import
`DocumentStatic` from `@/components/editor/document/static`. Keep `@types/hast`
and `@types/mdast` as direct consumer dependencies. Keep copied pure models and
`document/optional-nodes.ts`. Register `EditorDocumentClipboardExtension` in the
stable root extension array. Call `registerDocumentPaste` after editor creation.
Retain its cleanup callback. Validate complete documents before replacement.
Keep host HTML sanitization. Retain canonical block metadata, table borders, and
`data-editor-row-height`. Failed imports preserve existing content. Stream
imports commit only at EOF. Abort stale requests. Cancellation cannot stop a
noncooperative producer. Register math and mention nodes before importing their
representations. Markdown supports TeX delimiters with canonical HTML fallback
when required for fidelity. Static and standalone HTML use native MathML.
Mentions use the validated identity codec. Saved mention identities do not grant
access. Media JSON and canonical tagged figure HTML retain native metadata.
Markdown uses canonical HTML for media. Register `MediaExtension` for live
rendering or `MediaNode` in headless readers. Media URLs cannot contain
credentials, queries, or fragments. Register optional feature nodes before live
import. Readers retain footnotes, contents, columns, dates, labels, drawings,
editable cards, and diagram metadata. Optional nodes use canonical HTML
fallback. Markdown footnote input is supported. Transient card fields are not
saved. Drawing SDKs do not run during static conversion. Review nodes remain
unsupported. Do not use conversion to remove unknown nodes or formatting without
approval. See https://ui.yopem.com/components/editor-document for supported
formats.

## Optional editor media

Install `editor-media` separately. Import parts from
`@/components/editor/media`. Register `MediaExtension` in a stable root
extension array. Compose `MediaInsertControl` inside `EditorToolbar`. Mount
`MediaFileClipboard` inside `EditorRoot` with a stable host upload callback. It
handles one file per paste or drop. Without upload, it registers nothing. Rich
MIME and higher-priority host handlers stay first. Callback changes cancel
pending work. Host callbacks enforce size, content, authorization, and quota
limits. `MediaContent` and image preview parts work without `EditorRoot`.
Compose `MediaPreviewRoot`, `MediaPreviewTrigger`, and `MediaPreviewDialog`, or
use `MediaPreviewGallery`. Supply unique image IDs. Zoom stays local. Use the
house Slider and ScrollArea controls for keyboard zoom and scrolling.
`MediaEmbedContent` needs an explicit provider or exact HTTPS-origin policy.
Frames need user consent. Source, policy, and disabled changes discard consent.
Tweet embeds use the fixed platform.twitter.com endpoint. HTML exports keep
inert links. Origin validation does not check DNS or redirects. Keep these
controls in the host. Use HTTPS URLs without credentials. Supply alt text and
captions for your content. Keep native playback, file links, and iframe controls
usable in read-only roots. Supply bounded, abort-aware host uploads with server
authorization and validation. Private assets need explicit same-origin delivery
integration. Never put tokens in media URLs. Register `MediaNode` in document
readers. Do not flatten unsupported media during conversion.

## Optional footnotes and table of contents

Install `editor-footnotes` and `editor-toc` separately. Import parts from
`@/components/editor/footnote` and `@/components/editor/toc`. Keep feature
extensions stable when the root mounts. Compose controls inside `EditorToolbar`.
`EditorFootnoteTypeahead` owns the editable surface. Do not add adjacent
`EditorContent`. Keep repeated and unresolved references and duplicate
definitions. Renumber a selected duplicate explicitly. Do not silently rewrite
identifiers. Table-of-contents links target the current editor only. Base
contents controls do not require typeahead. Add `editorTocSlashCommand` only to
a configured slash controller. Register feature nodes in each reader. Model
fragment codecs do not validate complete host documents. Document readers
support validated footnotes and table-of-contents nodes. Keep canonical
reference IDs.

## Optional editor columns and dates

Install the optional source items with your selected package manager.

```sh
bunx --bun @yopem-ui/cli add editor-columns
bunx --bun @yopem-ui/cli add editor-date
npx @yopem-ui/cli add editor-columns
npx @yopem-ui/cli add editor-date
pnpm dlx @yopem-ui/cli add editor-columns
pnpm dlx @yopem-ui/cli add editor-date
yarn dlx @yopem-ui/cli add editor-columns
yarn dlx @yopem-ui/cli add editor-date
```

Register `EditorColumnsExtension` from `@/components/editor/columns` in a stable
root extension array. Register `EditorDateExtension` from
`@/components/editor/date` in that array. Compose `EditorColumnsControls` and
`EditorDateControls` inside `EditorToolbar`. Use focused column insert, layout,
resize, move, and remove controls when needed. Columns contain two through four
native rich-text containers. Nested column groups are not supported. Use the
house Slider for resizing. Remove deletes the group and its content. The house
Calendar inserts dates and edits native date nodes through `EditorDateInline`.
Store validated YYYY-MM-DD strings without timezone conversion. Use
`editorDateFromLocalDate` for local dates. Import pure codecs from
`@/components/editor/columns-model` and `@/components/editor/date-model`. Keep
all copied feature and core selection helpers. Shared packages must export both
feature and model subpaths. Document readers retain validated columns and dates.
Register the matching nodes before live import. Never flatten unknown nodes.
Supply complete host document validation; feature validators check only their
own contracts. See https://ui.yopem.com/components/editor-columns and
https://ui.yopem.com/components/editor-date for composition.

## Optional editor math

Install `editor-math` for inline and block TeX equations. Register
`EditorMathExtension` in a stable extensions array. Compose `EditorMathControls`
inside `EditorToolbar`. Use `EditorMathControl kind="inline"` or `kind="block"`
to insert an equation. Omit `kind` to edit one selected equation. Use
`EditorMathPreview` for the current expression. Select equations with pointer
input or keyboard focus. Apply changes, cancel changes, or delete the selected
equation. Host document changes expire saved targets. Read-only roots cannot
change equations.

```sh
bunx --bun @yopem-ui/cli add editor-math
npx @yopem-ui/cli add editor-math
pnpm dlx @yopem-ui/cli add editor-math
yarn dlx @yopem-ui/cli add editor-math
```

KaTeX renders native MathML. No stylesheet, font, CDN, or service import is
required. Browser MathML support controls visual output. Keep a visible error
for invalid TeX. Trust features and user macros are not supported. TeX has a
4096-character limit. Use `math-model` for pure JSON, HTML attribute, and
Markdown fragment codecs. Use `math-node` for native Lexical JSON and HTML
conversion. JSON uses type `editor-math`, version `1`, kind `inline` or `block`,
and `tex`. HTML uses `span` for inline math and `div` for block math. Both
elements require `data-editor-math` and `data-editor-tex`. Exported text
contains TeX, not rendered HTML. Sanitize host HTML before import. Validate
metadata before replacing document content. These fragment codecs do not parse
complete documents or Plate state.

## Editor private assets

Use the separate `editor-assets` server library with D1 or PostgreSQL and
private R2 or S3. Apply matching dialect migrations 0001, 0002, and 0003 in
order. Keep authentication, verified expiry, document and asset policy, exact
origins, and CSRF checks in the host. Reuse factory instances. Supply quotas,
bounded structural decoders, security scanners, and recurring cleanup with
complete inventory cycles. Do not treat fixture validators or signatures as
production scanners. Keep immutable attempts, fences, terminal probes, and
permanent lifetime reservations. Resolve private relative asset routes against
an explicit trusted HTTPS same-origin delivery origin. Validate the exact
document and asset route. Native media requires existing same-origin cookie
authentication. Never put tokens in URLs, return bucket keys, or use public
bucket fallbacks. Keep provider credentials and server imports out of browser
entries. This item adds no media UI nodes or accounts. See
https://ui.yopem.com/docs/editor-assets for migration, callback, delivery, and
deployment limits. Asset repositories do not receive request cancellation.
PostgreSQL timeouts apply per statement, not cumulatively. Configure host limits
for pool waits. D1 batches and R2 binding calls cannot be interrupted through
this API. S3 fetches receive cancellation signals.

## Optional whole-block selection

Install `editor-block-selection` separately. Create one stable controller with
`createEditorBlockSelection`. Compose `EditorBlockSelection` inside
`EditorRoot`. Use the gutter and actions for keyboard selection and movement.
Use drag handles for pointer movement. Keep keyboard movement available. Require
synchronous literal `true` from `authorizeCut` before native cut. Preserve
native MIME handlers and higher-priority host cancellation. Require literal
`true` from custom document validation. Content, selection, and read-only
changes expire saved operations. Authorize persisted document writes separately.
Import parts from `@/components/editor/block-selection-index`.

## Optional CSV paste

Install `editor-csv` separately. Register `EditorCsvExtension` in a stable root
extension array. Use `parseEditorCsv` from `@/components/editor/csv-model` for
pure parsing. Keep native Lexical JSON/HTML priority and HIGH/CRITICAL host
paste vetoes. Configure `EditorTablePresentationExtension` with `pasteTsv:false`
when CSV owns tab-containing input. HTML validation stays active. Reject
malformed quotes, unequal row widths, and inputs above 1 MiB or 50 by 50 cells
before content changes. Plain text needs a comma and multiple lines. Explicit
`text/csv` also supports one row. Fields remain plain text. Do not evaluate
formulas or render HTML.

## Optional editor search

Install `editor-search` separately. Compose `EditorSearchRoot` inside
`EditorRoot`. Place `EditorContent` inside `EditorSearchViewport`. Use the
input, previous/next, and status parts. Search does not replace text or persist
highlights. Queries use at most 64 Unicode code points. Results contain at most
200 matches within individual TextNodes, not across styled nodes. Use
`@/components/editor/search-model` for pure helpers outside React. Preserve host
cancellation and read-only navigation.

## Optional floating editor controls

Install `editor-floating-toolbar` separately. Import `EditorFloatingToolbar`
from the copied `@/components/editor/floating-toolbar` module. Compose it inside
EditorRoot beside EditorContent. Use existing editor controls as children.
Select native text to open the toolbar. Press Alt+F10 to focus its first enabled
button. Keep the saved-range guard. Document changes and read-only transitions
invalidate the target.

## Optional native editing rules

Install `editor-editing-rules` separately. Import
`createEditorEditingRulesExtension` from the copied
`@/components/editor/editing-rules` module. Create a stable extension array
before the root mounts. Mod+Enter exits the containing root block; Shift inserts
before it. Single-paragraph modes retain one paragraph for Enter and modifier
shortcuts. Other shapes keep native behavior without flattening. Plain text has
a 1 MiB limit. Converted block text has a 2501-line limit. Keep higher-priority
host handlers, IME, native Tab, and empty-paste preservation.

## Selected block placeholders

Install `editor-block-placeholder` separately. Import `EditorBlockPlaceholder`
from `@/components/editor/block-placeholder`. Mount one layer beside
`EditorContent` inside `EditorRoot`. Keep labels fixed until unmount. Hints
apply only to focused, editable, empty root elements. Use native node types or
heading tags as label keys. Placeholder text stays outside document content and
serializers. Preserve native focus, history, and host classes.

## Optional native Markdown fragment paste

Pass `{ markdown: true }` to `registerDocumentPaste` to insert validated
Markdown at the caret. Keep `EditorDocumentClipboardExtension` in the stable
root extensions array. Keep registration cleanup in the host lifecycle. Lexical
JSON and HTML have priority. Without this option, plain-text paste stays native.
Rejected empty or unsupported fragments keep selected content. Higher-priority
host vetoes still apply.

## Optional editor input shortcuts

Install `editor-autoformat` separately. Import `EditorAutoformatExtension` from
`@/components/editor/autoformat`. Keep it in a stable root extensions array.
Base Markdown shortcuts remain separate. Additional rules support checklist and
nested quote prefixes, horizontal rules, and smart text substitutions. Configure
stable element and text-match `transformers` with Lexical `configExtension`.
Host rules precede the extension's built-ins. Set `includeBuiltInRules` to
`false` to disable only these built-ins. Base Markdown stays separate. Register
transformer node dependencies at root creation. Keep callbacks synchronous and
regular expressions bounded. Host rules are not a sandbox. Remount to change
rule configuration. Code remains literal. Fractions require word boundaries.
Check native input policies, IME, history, and clipboard before production use.

Document readers support plain native horizontal rules. Register
`HorizontalRuleExtension` for live imports. Keep rules in block containers.
Unsupported presentation rejects instead of being discarded. Static output uses
the house Separator. Conversion workflows remain runtime-unverified.

## Optional editor block behavior

Install `editor-block-behavior` separately. Import
`EditorBlockBehaviorExtension` from `@/components/editor/block-behavior`.
Register it in a stable root extension array. Collapsed heading Enter makes the
new half a paragraph. Higher-priority host handlers can preempt the LOW-priority
rule. Other native handlers remain unchanged. Validate metadata, selection,
composition, history, and nested contexts before production use.

### Native label tokens

Install optional `editor-labels`. Import parts from
`@/components/editor/labels`. Keep `createEditorLabelsExtension(options)` stable
for the root. Compose the picker or house CheckboxGroup options. Use one through
64 unique options and at most ten tokens. Apply host minimum counts separately.
Replace only label-only content. Register EditorLabelNode in each reader. Use
labels-model for pure validation. Invalid node metadata rejects. Unknown,
duplicate, and excess valid tokens become plain text. Labels grant no access.
Document readers retain validated label tokens. Register label nodes before live
import.

## Optional Word clipboard

Install the separate bounded Office HTML feature.

```sh
bunx --bun @yopem-ui/cli add editor-word-clipboard
npx @yopem-ui/cli add editor-word-clipboard
pnpm dlx @yopem-ui/cli add editor-word-clipboard
yarn dlx @yopem-ui/cli add editor-word-clipboard
```

Register `EditorWordClipboardExtension` in a stable root extensions array.
Import helpers from `@/components/editor/word-clipboard` and pure normalization
from `@/components/editor/word-clipboard-model`. Call `registerDocumentPaste`
and `registerWordClipboardPaste` after creation. Keep both cleanup functions. Do
not change resolver options before remounting.

Keep native JSON and host MIME priority. Unsupported or stale fragments must not
remove selected content. Images reject by default. Supply a synchronous resolver
for already trusted media. Register `MediaExtension` for resolved images. Never
fetch pasted file or network image URLs automatically. Promises and thenables
reject. Host callback side effects cannot be rolled back.

This feature is separate from DOCX files. Full Word page layout and native
capture acceptance are not supplied. See
https://ui.yopem.com/components/editor-word-clipboard.

## Optional print and document images

```sh
bunx --bun @yopem-ui/cli add editor-document-export
npx @yopem-ui/cli add editor-document-export
pnpm dlx @yopem-ui/cli add editor-document-export
yarn dlx @yopem-ui/cli add editor-document-export
```

Print controls install without an image SDK. Compose controls inside
`EditorRoot`. Read-only roots can export validated snapshots without changing
selection or history. PNG requires an explicit capture callback.

```sh
bunx --bun @yopem-ui/cli add editor-document-export-image
npx @yopem-ui/cli add editor-document-export-image
pnpm dlx @yopem-ui/cli add editor-document-export-image
yarn dlx @yopem-ui/cli add editor-document-export-image
```

Import `captureEditorDocumentImageWithHtmlToImage` from
`@/components/editor/document-export-html-to-image`. Pass it as `capture` to the
PNG control. Keep its dependency license notice. Remote images need an
abort-aware host resolver with exact origin and private asset checks.
Credential, query, and fragment URLs reject. Supply a CSP nonce when required.
Print and PNG layouts allow 4096 by 16384 pixels and 16777216 pixels total.
Image limits count every occurrence, including cached images. PNG checks
validate container structure and checksums, not decoded pixels. Only one export
can run. Cancelled work retains capacity until settlement. Print dialogs and
synchronous browser work cannot be stopped. Verify local font, SVG
foreignObject, CSP, owner-document cleanup, keyboard, and real output behavior.
Runtime checks remain deferred.

## Optional Word files

Install the separate source item:

```sh
bunx --bun @yopem-ui/cli add editor-docx
npx @yopem-ui/cli add editor-docx
pnpm dlx @yopem-ui/cli add editor-docx
yarn dlx @yopem-ui/cli add editor-docx
```

Import `parseDocx`, `importDocx`, and `exportDocx` from
`@/components/editor/docx`. Compose `EditorDocxImportControl`,
`EditorDocxExportControl`, or `EditorDocxControls` inside `EditorRoot`. Import
these client parts from `@/components/editor/docx-controls`. Read-only roots can
export but cannot import. Supply cancellation signals for host lifecycle
changes. Keep the independent 1 MiB archive and decoded-data limits. Native
deflate decompression is required for compressed Word files. Unsupported content
rejects before replacement. Full Word layout, images, macros, headers, and
footers are not supported. Synchronous parsing cannot be stopped. Word clipboard
cleanup is a separate integration. See
https://ui.yopem.com/components/editor-docx for the current subset and limits.

### Native list presentation

Install this optional item separately.

```sh
bunx --bun @yopem-ui/cli add editor-list-presentation
npx @yopem-ui/cli add editor-list-presentation
pnpm dlx @yopem-ui/cli add editor-list-presentation
yarn dlx @yopem-ui/cli add editor-list-presentation
```

Import controls from `@/components/editor/list-presentation`. Register
`EditorListPresentationExtension` in a stable root extensions array. Compose
`EditorListMarkerControl`, `EditorListStartControl`, or
`EditorListPresentationControls` inside `EditorToolbar`. Markers affect one
native list. Nested lists and checklists keep their own behavior. Preserve
`yopemListMarker` NodeState, `data-editor-list-marker`, and native ordered-list
`start` attributes. Starts accept signed 32-bit integers. Invalid drafts and
stale selections cannot change lists.

Optional `editor-document` retains validated list markers and signed starts in
JSON, HTML, Markdown, and static output. Markdown uses canonical HTML when
native Markdown cannot retain list presentation.

Install optional `editor-editable-card` separately. Import parts from
`@/components/editor/editable-card`. Register `EditorEditableCardExtension` at
root creation. Compose `EditorEditableCardInsertButton` inside `EditorToolbar`.
Keep native Tab order. Local fields and nested notes are transient and reset
after card removal or import. The nested editor has independent history. JSON
stores only type and version. Document readers retain this saved node, not
transient form values or nested-editor drafts.

Install optional `editor-copilot`. Import `EditorCopilot` from
`@/components/editor/copilot` inside `EditorRoot`. Supply stable host endpoint,
document ID, authentication, and CSRF configuration. No default endpoint or
model exists. Control+Space requests paragraph-end completion. Tab accepts all
completed text; Mod+Right accepts one grapheme. Escape cancels. Require
completion and clean EOF. Automatic requests require host and user opt-in and
can incur charges. Keep document authorization, quota, provider credentials, and
model selection on the server. Cancellation does not prove billing stops.

Install optional `editor-block-menu`. Import `createEditorBlockMenu` and
`EditorBlockMenu` from `@/components/editor/block-menu-index`. Keep one stable
controller per root. Register its extension before wrapping `EditorContent` with
the menu. Right-click or press Shift+F10. Configured policy must return literal
`true`; stale or pending targets reject. Host Ask AI and Code Drawing callbacks
require separate authorization. No default service is supplied. Their second
argument retains a validated target after menu close. Subscribe to its
availability. Call `restoreSelection` from the native control's `onClick`
handler. Prevent default when restoration fails. Call `refresh` after host
policy changes. Dispose retained preparations during cleanup. New captures,
content changes, and read-only transitions invalidate them. For Add comment,
supply `onAddComment` and an `authorizeAction` policy that returns literal
`true`. The callback owns review UI, focus, and storage. It receives frozen
block context. The controller does not restore the captured selection for this
action. Preserve native selection, clipboard policy, history, and host event
cancellation.

## Native diagram controls

Install `editor-diagram` separately. Import controls from
`@/components/editor/diagram`. Register `EditorDiagramExtension` in a stable
extensions array. Compose `EditorDiagramRoot` inside `EditorRoot` with explicit
renderers. Use focused Toolbar, InsertButton, KindSelect, ViewModeSelect,
RenderButton, DownloadButton, DeleteButton, Status, and Preview parts.

Native JSON and marked code HTML keep metadata. Document readers retain this
metadata without running renderers. Source stays visible until a matching
sanitized SVG image loads. Only SVG download is supplied. Install optional
Mermaid, PlantUML, Graphviz, and Flowchart adapters as separate registry items.
Import SDK adapters only in browser-only entries, never SSR routes. Use
`renderEditorDiagram` for direct calls. It checks budgets and sanitizes SVG.
Source filters are supported subsets, not SDK sandboxes. Cancellation cannot
stop synchronous SDK work. Validate engine, CSP, WebAssembly, and lifecycle
compatibility before deployment. Host endpoints need authentication, document
authorization, exact Origin, CSRF, and execution limits. Never put credentials
in diagram URLs. Supply headers explicitly. See
https://ui.yopem.com/editor/diagram-root for composition and API details.

## Optional AI command menu

Install `editor-ai-menu` for configured commands and bounded local chat. Compose
EditorAiMenuRoot, EditorAiMenuTrigger, EditorAiMenuContent, and
EditorAiMenuPanel inside configured EditorAiRoot. Import EditorAiInlinePreview
from `@/components/editor/ai-menu-preview` for bounded escaped proposal text
beside the saved range. It changes no document state. Keep explicit approval
controls. EditorAiMenuContent owns the editable surface. Do not add
EditorContent beside it. Pass
`render={<EditorTypeahead controller={controller} />}` to compose typeahead into
that surface. Install editor-typeahead for this composition. Keep the controller
and root extensions stable. Supply an explicit same-origin host endpoint,
document ID, and current authentication and CSRF headers. Only explicit user
requests start inference. Approve cleanly completed plain text explicitly.
Review comments require the current review controller and literal-true host
policy. Suggest change creates an inline review suggestion from completed
single-line output. It requires current suggest permission and a valid saved
range. Accept or reject the suggestion separately. Authorize document writes
separately. Twelve truncated chat messages stay in memory across closes until
the menu root unmounts. Remount on document or viewer changes. No server chat
storage is supplied. Null selection retains the dialog target. Remount
EditorAiRoot to discard it. Selected-text context actions respect prevented host
events. Supply synchronous markdownInsertion for optional validated Markdown
approval. Install editor-document and call $insertDocumentFragment inside the
supplied update. Return literal true only after insertion succeeds. Failed
insertion keeps the proposal open. Register required nodes before rich
insertion. MDX remains literal source. Below insertion requires a supported
native block container. Runtime acceptance remains deferred.

### Native cursor overlays

Install optional `editor-cursor-overlay` separately. Import
`EditorCursorOverlay` from `@/components/editor/cursor-overlay`. Compose it
inside `EditorRoot` beside `EditorContent`. Keep native drag and drop. Overlay
paint is not saved document state or AI authorization. The root owner document
supplies the portal and native selection. Read-only transitions and document
changes clear the paint.

### Optional native drawing scenes

Install `editor-drawing` separately. Register `EditorDrawingExtension` in a
stable root array. Load `@/components/editor/drawing-browser` and the SDK
stylesheet inside a framework browser boundary. Self-host the installed SDK
fonts and preserve SDK and font notices. Restrict fallback font resources
through CSP. Register one drawing runtime per root and run its cleanup.
Concurrent runtimes must share the asset path. Keep scenes within 512 KiB and
2000 supported shapes. Files, images, link targets, and custom metadata reject.
Read-only roots can open saved scenes in view mode. They cannot insert or apply
drawing edits. Validate drafts and sanitize SVG before download. Document
readers retain validated scene metadata, not SDK-rendered output. SDK dependency
advisories and runtime/SSR/accessibility acceptance remain unresolved. Do not
claim production safety.
