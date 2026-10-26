import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link"
import {
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from "lexical"

import type { createEditorSelectionBookmark } from "./selection-bookmark"

import { isSafeLink } from "./link-url"

export interface EditorLinkEditTarget {
  linkKey: NodeKey | null
  url: string
  text: string
  newTab: boolean
}

export interface EditorLinkEdit {
  url: string
  text: string
  newTab: boolean
}

function $getLinkAncestor(node: LexicalNode | null) {
  let current = node

  while (current) {
    if ($isLinkNode(current)) return current
    current = current.getParent()
  }

  return null
}

export function $getEditorLinkEditTarget() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return null
  const anchorLink = $getLinkAncestor(selection.anchor.getNode())
  const focusLink = $getLinkAncestor(selection.focus.getNode())

  const link =
    anchorLink && focusLink && anchorLink.getKey() === focusLink.getKey()
      ? anchorLink
      : null

  return {
    linkKey: link?.getKey() ?? null,
    url: link?.getURL() ?? "",
    text: link?.getTextContent() ?? selection.getTextContent(),
    newTab: link?.getTarget() === "_blank",
  }
}

export function applyEditorLinkEdit(
  editor: LexicalEditor,
  bookmark: ReturnType<typeof createEditorSelectionBookmark>,
  target: EditorLinkEditTarget,
  edit: EditorLinkEdit,
) {
  if (
    !editor.isEditable() ||
    editor._updating ||
    editor._dirtyElements.size > 0 ||
    editor._dirtyLeaves.size > 0 ||
    !bookmark.getSnapshot() ||
    !isSafeLink(edit.url) ||
    !edit.text.trim() ||
    /[\r\n]/.test(edit.text)
  )
    return false

  let applied = false

  editor.update(
    () => {
      if (!editor.isEditable() || !bookmark.restore()) return
      const currentTarget = $getEditorLinkEditTarget()

      if (!currentTarget || currentTarget.linkKey !== target.linkKey) return

      if (target.linkKey !== null) {
        const currentLink = $getNodeByKey(target.linkKey)

        if (!$isLinkNode(currentLink) || !currentLink.isAttached()) return

        const link = $isAutoLinkNode(currentLink)
          ? currentLink.replace(
              $createLinkNode(currentLink.getURL()).updateFromJSON(
                currentLink.exportJSON(),
              ),
              true,
            )
          : currentLink

        link.setURL(edit.url)
        link.setTarget(edit.newTab ? "_blank" : null)

        if (edit.newTab) {
          const rel = new Set(
            (link.getRel() ?? "")
              .split(/\s+/)
              .filter((token) => token && token.toLowerCase() !== "opener"),
          )

          rel.add("noopener")
          rel.add("noreferrer")
          link.setRel([...rel].join(" "))
        }

        if (link.getTextContent() !== edit.text) {
          link.clear()
          const text = $createTextNode(edit.text)
          link.append(text)
          text.select(0, edit.text.length)
        }

        applied = true

        return
      }

      const selection = $getSelection()

      if (!$isRangeSelection(selection)) return

      const rel = edit.newTab ? "noopener noreferrer" : "noreferrer"

      const attributes = {
        target: edit.newTab ? "_blank" : null,
        rel,
      }

      if (selection.getTextContent() !== edit.text) {
        const link = $createLinkNode(edit.url, attributes)
        link.append($createTextNode(edit.text))
        selection.insertNodes([link])
        const text = link.getFirstChild()

        if ($isTextNode(text)) text.select(0, edit.text.length)
      } else {
        applied = editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
          url: edit.url,
          ...attributes,
        })

        return
      }

      applied = true
    },
    { discrete: true, tag: HISTORY_PUSH_TAG },
  )

  return applied
}
