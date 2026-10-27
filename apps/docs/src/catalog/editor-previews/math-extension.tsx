"use client"

import { EditorRoot, EditorContent, EditorToolbar } from "@yopem-ui/editor"
import {
  EditorMathExtension,
  EditorMathControls,
  EditorMathPreview,
} from "@yopem-ui/editor/math"

const extensions = [EditorMathExtension]

const previewValue = { kind: "block", tex: "\\frac{a}{b} + x^2" } as const

export function Preview() {
  return (
    <EditorRoot extensions={extensions} ariaLabel="EditorMathExtension preview">
      <EditorToolbar>
        <EditorMathControls />
      </EditorToolbar>
      <EditorContent />
      <EditorMathPreview value={previewValue} />
    </EditorRoot>
  )
}
