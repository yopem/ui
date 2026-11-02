import type { LexicalEditor, NodeKey } from "lexical"

import { $isHeadingNode, type HeadingNode } from "@lexical/rich-text"
import { $dfsWithSlotsIterator } from "@lexical/utils"
import { $getNodeByKey, $getSelection, $isRangeSelection } from "lexical"

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
  const headings: EditorTocHeading[] = []

  for (const { node } of $dfsWithSlotsIterator()) {
    if (!$isHeadingNode(node)) continue
    const title = headingTitle(node)

    if (!title) continue
    headings.push({
      key: node.getKey(),
      title,
      depth: Number(node.getTag().slice(1)),
    })

    if (headings.length === 500) break
  }

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

  if (!element) return false

  if (!editor.isEditable()) {
    element.focus({ preventScroll: true })
    element.scrollIntoView({
      block: "start",
      behavior: scrollBehavior(element),
    })

    return true
  }

  let focused = false
  editor.getRootElement()?.focus({ preventScroll: true })
  editor.update(
    () => {
      const node = $getNodeByKey(key)

      if (!$isHeadingNode(node)) return
      node.selectStart()
      focused = true
    },
    { discrete: true },
  )

  if (!focused) return false

  const heading = editor.getElementByKey(key)

  if (!heading) return false
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({
    block: "start",
    behavior: scrollBehavior(heading),
  })

  return true
}

function scrollBehavior(element: HTMLElement): ScrollBehavior {
  const view = element.ownerDocument.defaultView

  return !view || view.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth"
}
