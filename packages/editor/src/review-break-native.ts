import {
  $createLineBreakNode,
  $getRoot,
  $getState,
  $isElementNode,
  $setState,
  type LexicalNode,
  type RangeSelection,
} from "lexical"

import type { EditorReviewBreakSuggestion } from "./review-codecs"

import { editorReviewBreakState } from "./review-state"

export interface EditorReviewBreakTarget {
  readonly node: LexicalNode
  readonly suggestion: EditorReviewBreakSuggestion
}

export function $getEditorReviewBreaks() {
  const pending = [...$getRoot().getChildren()]
  const breaks: EditorReviewBreakTarget[] = []

  while (pending.length) {
    const node = pending.pop()!
    const suggestion = $getState(node, editorReviewBreakState)

    if (suggestion) breaks.push({ node, suggestion })

    if ($isElementNode(node)) pending.push(...node.getChildren())
  }

  return breaks
}

export function $insertEditorReviewBreak(
  selection: RangeSelection,
  suggestion: EditorReviewBreakSuggestion,
  selectStart = false,
) {
  if (suggestion.kind === "paragraph") {
    const paragraph = selection.anchor.getNode().getTopLevelElement()

    if (
      !$isElementNode(paragraph) ||
      paragraph.getType() !== "paragraph" ||
      paragraph.getParent() !== $getRoot() ||
      $getState(paragraph, editorReviewBreakState)
    )
      return null

    const next = selection.insertParagraph()

    if (!next) return null
    $setState(paragraph, editorReviewBreakState, suggestion)

    return next
  }

  const lineBreak = $createLineBreakNode()
  selection.insertNodes([lineBreak])
  $setState(lineBreak, editorReviewBreakState, suggestion)

  if (selectStart) {
    const parent = lineBreak.getParentOrThrow()
    const index = lineBreak.getIndexWithinParent()
    parent.select(index, index)
  }

  return lineBreak
}

export function $canResolveEditorReviewBreak(target: EditorReviewBreakTarget) {
  if (target.suggestion.kind === "linebreak")
    return target.node.getType() === "linebreak"

  if (!$isElementNode(target.node) || target.node.getType() !== "paragraph")
    return false

  const next = target.node.getNextSibling()

  return $isElementNode(next) && next.getType() === "paragraph"
}

export function $resolveEditorReviewBreak(
  target: EditorReviewBreakTarget,
  action: "accept" | "reject",
) {
  if (!$canResolveEditorReviewBreak(target)) return false

  if (target.suggestion.kind === "linebreak") {
    if (action === "reject") target.node.remove()
    else $setState(target.node, editorReviewBreakState, null)

    return true
  }

  if (!$isElementNode(target.node)) return false
  const next = target.node.getNextSibling()

  if (!$isElementNode(next) || next.getType() !== "paragraph") return false

  if (action === "accept") {
    $setState(target.node, editorReviewBreakState, null)

    return true
  }

  const followingBreak = $getState(next, editorReviewBreakState)
  target.node.append(...next.getChildren())
  next.remove()
  $setState(
    target.node,
    editorReviewBreakState,
    followingBreak?.kind === "paragraph" ? followingBreak : null,
  )

  return true
}
