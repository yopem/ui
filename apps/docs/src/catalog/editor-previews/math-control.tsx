"use client"

import { EditorRoot, EditorContent, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorMathExtension,
  EditorMathControl,
  EditorMathPreview,
} from "@yopem-ui/editor/math"

const extensions = [EditorMathExtension]

const previewValue = { kind: "block", tex: "\\frac{a}{b} + x^2" } as const

export function Preview() {
  return (
    <EditorRoot extensions={extensions} ariaLabel="EditorMathControl preview">
      <EditorToolbar>
        <EditorMathControl kind="inline" />
      </EditorToolbar>
      <EditorContent />
      <EditorMathPreview value={previewValue} />
    </EditorRoot>
  )
}
