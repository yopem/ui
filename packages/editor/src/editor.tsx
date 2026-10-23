"use client"

import type { EditorProps } from "./extension"

import {
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockButton,
  EditorListButton,
  EditorIndentButton,
  EditorTableButton,
} from "./controls"
import { EditorLinkControl } from "./link-control"
import { EditorRoot, EditorContent } from "./root"

export function Editor({ placeholder, ...props }: EditorProps) {
  return (
    <EditorRoot {...props}>
      <EditorToolbar>
        <EditorFormatButton format="bold" />
        <EditorFormatButton format="italic" />
        <EditorFormatButton format="underline" />
        <EditorFormatButton format="strikethrough" />
        <EditorFormatButton format="code" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
        <EditorBlockButton block="paragraph" />
        <EditorBlockButton block="h1" />
        <EditorBlockButton block="h2" />
        <EditorBlockButton block="h3" />
        <EditorBlockButton block="quote" />
        <EditorBlockButton block="code" />
        <EditorListButton listType="bullet" />
        <EditorListButton listType="number" />
        <EditorListButton listType="check" />
        <EditorIndentButton direction="indent" />
        <EditorIndentButton direction="outdent" />
        <EditorLinkControl />
        <EditorTableButton />
      </EditorToolbar>
      <EditorContent placeholder={placeholder} />
    </EditorRoot>
  )
}
