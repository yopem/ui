import { $isCodeNode } from "@lexical/code"
import { $isLinkNode } from "@lexical/link"
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
} from "lexical"

export interface EditorTypeaheadQuery {
  readonly kind: "slash" | "mention" | "emoji"
  readonly key: string
  readonly type: "text"
  readonly start: number
  readonly end: number
  readonly query: string
  readonly text: string
}

export function $readEditorTypeaheadQuery(): EditorTypeaheadQuery | null {
  const selection = $getSelection()

  if (
    !$isRangeSelection(selection) ||
    !selection.isCollapsed() ||
    selection.anchor.type !== "text"
  )
    return null
  const point = selection.anchor
  const node = point.getNode()

  if (
    !$isTextNode(node) ||
    !node.isSimpleText() ||
    node.hasFormat("code") ||
    !node.isAttached()
  )
    return null

  for (const parent of node.getParents())
    if ($isCodeNode(parent) || $isLinkNode(parent)) return null
  const text = node.getTextContent()
  const prefix = text.slice(0, point.offset)
  const slash = /^(\/)([^/@:\r\n\p{Zl}\p{Zp}]{0,64})$/u.exec(prefix)
  const match = slash ?? /(?:^|[\s\p{P}])([@:])([^\s/@:]{0,64})$/u.exec(prefix)
  const trigger = match?.[1]
  const query = match?.[2]

  if (!trigger || query === undefined || query.length > 64) return null
  const start = point.offset - query.length - 1

  if (start > 0 && /[@/:\\]/.test(text.slice(start - 1, start))) return null

  if (trigger === "/") {
    const parent = node.getParent()

    if (
      start !== 0 ||
      node.getPreviousSibling() !== null ||
      !$isElementNode(parent) ||
      parent.isInline()
    )
      return null
  }

  if (trigger === ":" && (!query || !/^[\p{L}\p{N}_+ -]+$/u.test(query)))
    return null

  if (trigger === "@" && /[.,!?;()[\]{}<>]/u.test(query)) return null

  return {
    kind: trigger === "/" ? "slash" : trigger === "@" ? "mention" : "emoji",
    key: node.getKey(),
    type: "text",
    start,
    end: point.offset,
    query,
    text,
  }
}

export function sameEditorTypeaheadQuery(
  a: EditorTypeaheadQuery | null,
  b: EditorTypeaheadQuery | null,
) {
  return (
    a !== null &&
    b !== null &&
    a.kind === b.kind &&
    a.key === b.key &&
    a.type === b.type &&
    a.start === b.start &&
    a.end === b.end &&
    a.query === b.query &&
    a.text === b.text
  )
}
