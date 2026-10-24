# Yopem UI editor

A rich text editor built with Lexical 0.52.0 and Yopem UI StyleX components.
This package provides the editor foundation. It does not provide Plate feature
parity.

Use the CLI to copy this source into a consumer project. This private workspace
does not publish an editor component package.

```tsx
import { Editor } from "@/components/editor"

export function NotesEditor() {
  return <Editor ariaLabel="Notes" placeholder="Write your notes…" />
}
```

`EditorProps` accepts `initialState` (Lexical JSON object or JSON string),
`onChange` (EditorState and LexicalEditor), `editable` (default true),
`ariaLabel` (default Rich text editor), `placeholder`, and optional Lexical
`extensions`. Keep extensions stable and remount when they change.
`initialState` sets content on mount. Remount to load another document. Invalid
initial state throws an error. Content changes call `onChange`; selection-only
changes do not.

The host must compile StyleX for this package and the registry sources. Load
registry tokens, reset styles, Inter, and IBM Plex Mono in the host app.

The foundation includes text formats, history, blocks, lists, links, Markdown
shortcuts, indentation, and table controls. Optional modules add code editing,
callouts, toggles, typeahead, math, columns, dates, media, and document
conversion. Register each optional extension when you create the root. Treat
saved JSON as untrusted input. Validate it before storage or publication.

## Composition

Use `Editor` for the preset. Compose `EditorRoot`, `EditorToolbar`, and
`EditorContent` for a custom interface. Keep controls inside the same root. Each
root has independent document state and history.

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

Use `EditorFormatButton`, `EditorHistoryButton`, `EditorBlockButton`,
`EditorListButton`, `EditorIndentButton`, `EditorLinkControl`, and
`EditorTableButton` for individual controls. Controls preserve native props,
refs, `className`, and `xstyle`. Prevent the consumer click event to stop a
command. `EditorContent` shares the root accessible name and read-only state.
`useEditor` exposes the Lexical instance. `useEditorState` exposes text formats,
history availability, the accessible name, and read-only state.

## Media conversion

Install `editor-document` separately for document conversion. Portable readers
include the pure `MediaNode` codec. Register `MediaExtension` from
`editor-media` for live rendering. `MediaContent` also renders validated media
without a root.

Media JSON and canonical tagged figure HTML retain native metadata. Markdown
uses canonical HTML fallback. Conversion rejects media URL credentials, queries,
and fragments. It does not resolve private routes or configure asset access.
Hosts must supply authentication, delivery policies, and validated upload
callbacks.

## Optional code formatting

The repository uses Oxfmt. Base `editor-code` does not require Prettier. Supply
an `EditorCodeFormatter` to use your own formatter. Without a formatter, the
preset does not show formatting controls.

Install `editor-code-format` only for the optional Prettier adapter.

```sh
bunx --bun @yopem-ui/cli add editor-code-format
npx @yopem-ui/cli add editor-code-format
pnpm dlx @yopem-ui/cli add editor-code-format
yarn dlx @yopem-ui/cli add editor-code-format
```

Import `prettierEditorCodeFormatter` from the copied
`@/components/editor/code-format` module. Pass it through the `formatter` prop
on `EditorCode` or `EditorCodeFormatButton`. Syntax colors support more
languages than this adapter can format. Cancellation discards results. It cannot
stop synchronous parser work. This adapter does not change repository formatting
tools.

The optional code item statically registers Prism grammars. Check the final
application bundle before deployment. Preserve the dependency notices in
[LICENSE.md](./LICENSE.md).

Keep one Lexical module identity in SSR. The docs Vite app includes `lexical`
and `/^@lexical\//` in `ssr.noExternal`. Preserve existing entries. Verify each
consumer framework build. This setting does not define Next.js or RSC support.

## Server authentication

The separate `editor-auth` registry item supplies OpenAuth and Better Auth
adapters. Keep server imports out of browser components. Require a separate
document policy and route origin and CSRF checks. See the
[authentication guide](https://ui.yopem.com/docs/editor-auth).

Both adapters supply `credentialExpiresAt` as Unix epoch milliseconds.
Authorization rejects invalid or expired metadata, including expiry during a
policy check. Legacy HTTP authenticators can omit this field. Collaboration
ticket issuers must require verified expiry. The collaboration items supply
ticket handling, but do not guarantee immediate session revocation.

Better Auth verification disables cookie caching and session refresh. Host auth
routes remain responsible for refresh.

## Server collaboration

The separate `editor-collaboration-server` item supplies ticket, session, and
protocol helpers. Install `editor-collaboration-worker`,
`editor-collaboration-bun`, or `editor-collaboration-node` for the selected
runtime. Keep native runtime imports out of browser and generic server entries.

Reuse host authentication with verified expiry, an exact HTTPS origin, CSRF
checks, literal-true document policies, real SQL transactions, and a
schema-complete initializer. Bun can use host TLS. The Node adapter uses
`node:http`; bind it privately behind a trusted HTTPS/WSS proxy. Recipient
rechecks do not make revocation atomic with database writes.

The `editor-v1` protocol uses binary document frames and bounded text readiness,
delivery, and ACK controls. History is bounded; no automatic compaction or
online generation rotation is supplied. Do not replay offline drafts with
uncertain durable outcomes. This source guide does not claim runtime or
deployment validation.

## Server AI core

The server AI module provides OpenAI, Anthropic, and Workers AI adapters. Keep
credentials and model choices on the host server. Supply document authorization,
verified credential expiry, CSRF checks, and quotas. Use an exact trusted HTTPS
origin. Workers AI uses Cloudflare's OpenAI-compatible Chat Completions
endpoint. Choose a compatible model and set explicit input, output, and time
limits. Cancellation does not prove that provider billing stopped. These
adapters do not create accounts or deploy routes.

## Server assets

The server assets module supports private R2 and S3 objects. Use D1 or
PostgreSQL for durable upload records. Reuse repository and handler instances.
Apply document and asset migrations in order. Provide existing authentication,
document policy, CSRF checks, quotas, and bounded file validation. Configure
scheduled cleanup and private, unversioned buckets. Cancellation does not prove
that an object write stopped.

All editor tests live under the repository's root `tests/` directory.
