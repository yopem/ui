import { MarkNode } from "@lexical/mark"
import {
  $getRoot,
  $getState,
  $isElementNode,
  $isTextNode,
  $createTextNode,
  $addUpdateTag,
  HISTORY_PUSH_TAG,
  type LexicalNode,
} from "lexical"

import type { EditorSuggestion } from "./review-codecs"

import {
  deriveReviewTextDiff,
  EditorReviewTextDiffError,
  reviewTextDiffSegments,
  type EditorReviewTextDiffOperation,
} from "./review-diff"
import { editorSuggestionState, $setEditorSuggestion } from "./review-state"

export function $reviewTextDiffSource() {
  const root = $getRoot()

  if (root.getChildrenSize() !== 1) return null
  const paragraph = root.getFirstChild()!

  if (
    paragraph.getType() !== "paragraph" ||
    !$isElementNode(paragraph) ||
    paragraph.getChildrenSize() > 10000
  )
    return null

  const stack: { node: LexicalNode; depth: number }[] = paragraph
    .getChildren()
    .reverse()
    .map((node) => ({ node, depth: 1 }))

  const text: string[] = []
  let count = 0
  let size = 0

  while (stack.length) {
    const { node, depth } = stack.pop()!

    if (++count > 10000 || depth > 24) return null

    if ($isTextNode(node)) {
      if (!node.isSimpleText() || $getState(node, editorSuggestionState))
        return null
      size += node.getTextContentSize()

      if (size > 4096) return null
      text.push(node.getTextContent())
    } else if (
      node instanceof MarkNode &&
      node.getChildrenSize() + count <= 10000
    )
      stack.push(
        ...node
          .getChildren()
          .reverse()
          .map((child) => ({ node: child, depth: depth + 1 })),
      )
    else return null
  }

  const value = text.join("")

  return reviewTextDiffSegments(value) ? { paragraph, text: value } : null
}

export function $applyEditorReviewTextDiff(
  target: string,
  createSuggestion: (
    kind: "insert" | "delete",
    format: number,
  ) => EditorSuggestion,
  assertCurrent: () => void,
) {
  const source = $reviewTextDiffSource()

  if (!source)
    throw new EditorReviewTextDiffError(
      "Document text diff requires one bounded paragraph without pending suggestions.",
    )

  const operations = deriveReviewTextDiff(source.text, target).filter(
    (operation) => operation.kind !== "equal",
  )

  const plans: {
    operation: EditorReviewTextDiffOperation
    suggestion: EditorSuggestion
  }[] = []

  for (const operation of operations) {
    const previous = plans.at(-1)
    const kind = operation.kind === "insert" ? "insert" : "delete"

    const paired =
      kind === "insert" &&
      previous?.operation.kind === "delete" &&
      previous.operation.offset + previous.operation.text.length ===
        operation.offset

    const suggestion: EditorSuggestion = paired
      ? { ...previous.suggestion, kind: "insert" }
      : createSuggestion(kind, 0)

    plans.push({ operation, suggestion })
  }

  assertCurrent()

  if (!plans.length) return 0
  $addUpdateTag("yopem-review-action")
  $addUpdateTag(HISTORY_PUSH_TAG)

  for (const { operation, suggestion } of plans.reverse()) {
    assertCurrent()
    const nodes = $getRoot().getAllTextNodes()

    if (operation.kind === "delete") {
      let offset = 0
      const end = operation.offset + operation.text.length

      for (const node of nodes) {
        const size = node.getTextContentSize()
        const startOffset = Math.max(0, operation.offset - offset)
        const endOffset = Math.min(size, end - offset)

        if (startOffset < endOffset) {
          const parts = node.splitText(startOffset, endOffset)
          const selected = parts[startOffset === 0 ? 0 : 1]
          $setEditorSuggestion(selected, {
            ...suggestion,
            beforeFormat: selected.getFormat(),
          })
        }

        offset += size

        if (offset >= end) break
      }
    } else {
      let remaining = operation.offset

      const point = nodes.find((node) => {
        if (remaining <= node.getTextContentSize()) return true
        remaining -= node.getTextContentSize()

        return false
      })

      const range = point
        ? point.select(remaining, remaining)
        : source.paragraph.selectStart()

      const node = $createTextNode(operation.text)
        .setFormat(point?.getFormat() ?? 0)
        .setStyle(point?.getStyle() ?? "")

      $setEditorSuggestion(node, suggestion)
      range.insertNodes([node])
    }
  }

  return plans.length
}
