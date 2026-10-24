"use client"

import { EditorContent, EditorRoot, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorColumnResizeControls,
  EditorColumnsInsertControl,
  EditorColumnsExtension,
} from "@yopem-ui/editor/columns"

const extensions = [EditorColumnsExtension]

export function Preview() {
  return (
    <EditorRoot ariaLabel="Columns editor" extensions={extensions}>
      <EditorToolbar aria-label="Column controls">
        <EditorColumnsInsertControl />
        <EditorColumnResizeControls />
      </EditorToolbar>
      <EditorContent placeholder="Insert columns, then select a column" />
    </EditorRoot>
  )
}
