import {
  createState,
  $setState,
  type LexicalNode,
  type TextNode,
} from "lexical"
import { z } from "zod"

import {
  parseEditorReview,
  reviewBreakSuggestionSchema,
  reviewNativeFragmentSchema,
  reviewNativeOperationSchema,
  reviewSuggestionSchema,
  type EditorReviewBreakSuggestion,
  type EditorReviewNativeFragment,
  type EditorReviewNativeOperation,
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

export const editorReviewNativeFragmentState = createState(
  "yopemReviewNativeFragment",
  {
    parse: (value): EditorReviewNativeFragment | null =>
      value === undefined || value === null
        ? null
        : reviewNativeFragmentSchema.parse(value),
  },
)

export const editorReviewNativeOperationState = createState(
  "yopemReviewNativeOperation",
  {
    parse: (value): EditorReviewNativeOperation | null =>
      value === undefined || value === null
        ? null
        : reviewNativeOperationSchema.parse(value),
  },
)

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

export function $setEditorReviewNativeOperation(
  node: LexicalNode,
  value: EditorReviewNativeOperation | null,
) {
  $setState(
    node,
    editorReviewNativeOperationState,
    value === null ? null : reviewNativeOperationSchema.parse(value),
  )
}

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
