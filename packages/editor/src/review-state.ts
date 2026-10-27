import { createState, $setState, type TextNode } from "lexical"
import { z } from "zod"

import {
  parseEditorReview,
  reviewBreakSuggestionSchema,
  reviewSuggestionSchema,
  type EditorReviewBreakSuggestion,
  type EditorReviewData,
  type EditorSuggestion,
} from "./review-codecs"
import {
  emptyEditorReviewStructural,
  parseEditorReviewStructural,
} from "./review-structural"

export const emptyReview = parseEditorReview({ version: 1, threads: [] })

export const editorReviewState = createState("yopemReview", {
  parse: (value): EditorReviewData =>
    value === undefined ? emptyReview : parseEditorReview(value),
})

export const editorSuggestionState = createState("yopemSuggestion", {
  parse: (value): EditorSuggestion | null =>
    value === undefined || value === null
      ? null
      : reviewSuggestionSchema.parse(value),
})

export const editorReviewBreakState = createState("yopemReviewBreak", {
  parse: (value): EditorReviewBreakSuggestion | null =>
    value === undefined || value === null
      ? null
      : reviewBreakSuggestionSchema.parse(value),
})

export const editorReviewStructuralState = createState(
  "yopemReviewStructural",
  {
    parse: (value) =>
      value === undefined
        ? emptyEditorReviewStructural
        : parseEditorReviewStructural(value),
  },
)

export const editorReviewKeyboardState = createState("yopemReviewKeyboard", {
  parse(value) {
    return value === undefined ? false : z.boolean().parse(value)
  },
})

export function $setEditorSuggestion(
  node: TextNode,
  value: EditorSuggestion | null,
) {
  $setState(
    node,
    editorSuggestionState,
    value === null ? null : reviewSuggestionSchema.parse(value),
  )
}
