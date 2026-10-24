import type { LexicalEditor, NodeKey } from "lexical"

import { HeadingNode, $isHeadingNode } from "@lexical/rich-text"
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
} from "lexical"

export interface EditorTocHeading {
  readonly key: NodeKey
  readonly title: string
  readonly depth: number
}

export interface EditorTocSnapshot {
  readonly headings: readonly EditorTocHeading[]
  readonly activeKey: NodeKey | null
}

function headingTitle(node: HeadingNode) {
  return node.getTextContent().replace(/\s+/g, " ").trim().slice(0, 256)
}

export function $getEditorTocSnapshot(): EditorTocSnapshot {
  const headings = $nodesOfType(HeadingNode)
    .filter((node) => node.isAttached())
    .map((node) => ({
      key: node.getKey(),
      title: headingTitle(node),
      depth: Number(node.getTag().slice(1)),
    }))
    .filter((heading) => heading.title.length > 0)
    .slice(0, 500)

  const selection = $getSelection()

  let selected = $isRangeSelection(selection)
    ? selection.anchor.getNode()
    : null

  while (selected && !$isHeadingNode(selected)) selected = selected.getParent()

  return {
    headings,
    activeKey:
      selected && headings.some((heading) => heading.key === selected?.getKey())
        ? selected.getKey()
        : null,
  }
}

export function focusEditorTocHeading(editor: LexicalEditor, key: NodeKey) {
  const element = editor.getElementByKey(key)

  if (!editor.isEditable()) {
    element?.focus()
    element?.scrollIntoView({ block: "start", behavior: scrollBehavior() })

    return Boolean(element)
  }

  let focused = false
  editor.update(() => {
    const node = $getNodeByKey(key)

    if (!$isHeadingNode(node)) return
    node.selectStart()
    focused = true
  })
  element?.scrollIntoView({ block: "start", behavior: scrollBehavior() })

  if (focused) {
    editor.focus()
    element?.focus()
  }

  return focused
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth"
}
