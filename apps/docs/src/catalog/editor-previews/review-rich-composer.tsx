"use client"

import type { EditorReviewRichContentValue } from "@yopem-ui/editor/review"

import { EditorReviewRichComposer } from "@yopem-ui/editor/review"
import { useState } from "react"

export function Preview() {
  const [, setDraft] = useState<EditorReviewRichContentValue | null>(null)

  return (
    <EditorReviewRichComposer label="Discussion draft" onChange={setDraft} />
  )
}
