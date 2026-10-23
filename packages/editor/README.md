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
shortcuts, indentation, and table insertion. It does not include collaboration,
media uploads, drag handles, slash menus, comments, document conversion, or full
table editing controls. Treat saved JSON as untrusted input. Validate it before
storage or publication.

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

## Server authentication

The separate `editor-auth` registry item supplies OpenAuth and Better Auth
adapters. Keep server imports out of browser components. Require a separate
document policy and route origin and CSRF checks. See the
[authentication guide](https://ui.yopem.com/docs/editor-auth).

All editor tests live under the repository's root `tests/` directory.
