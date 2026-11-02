import type { EditorState, LexicalEditor, NodeKey } from "lexical"

import { HeadingNode } from "@lexical/rich-text"
import {
  $addUpdateTag,
  $caretFromPoint,
  $createParagraphNode,
  $getEditor,
  $insertNodeToNearestRootAtCaret,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  HISTORY_PUSH_TAG,
  createCommand,
  defineExtension,
  mergeRegister,
} from "lexical"

import { EditorTocClipboardExtension } from "./toc-clipboard"
import { createEditorTocHTMLConfig } from "./toc-html"
import {
  EditorTocNode,
  $createEditorTocNode,
  $getEditorTocLabels,
} from "./toc-node"
import { getEditorTocHeadingId } from "./toc-runtime"
import { $getEditorTocSnapshot } from "./toc-state"

interface ManagedHeading {
  readonly element: HTMLElement
  readonly id: string | null
  readonly tabIndex: string | null
}

function restoreHeading(heading: ManagedHeading) {
  if (heading.id === null) heading.element.removeAttribute("id")
  else heading.element.setAttribute("id", heading.id)

  if (heading.tabIndex === null) heading.element.removeAttribute("tabindex")
  else heading.element.setAttribute("tabindex", heading.tabIndex)
}

function syncHeadings(
  editor: LexicalEditor,
  state: EditorState,
  managed: Map<NodeKey, ManagedHeading>,
) {
  const active = new Set<NodeKey>()

  state.read(() => {
    for (const [key, label] of $getEditorTocLabels())
      editor.getElementByKey(key)?.setAttribute("aria-label", label)

    for (const heading of $getEditorTocSnapshot().headings) {
      const element = editor.getElementByKey(heading.key)

      if (!element) continue
      active.add(heading.key)
      const previous = managed.get(heading.key)

      if (previous?.element !== element) {
        if (previous) restoreHeading(previous)
        managed.set(heading.key, {
          element,
          id: element.getAttribute("id"),
          tabIndex: element.getAttribute("tabindex"),
        })
      }

      element.id = getEditorTocHeadingId(editor, heading.key)
      element.tabIndex = -1
    }
  })

  for (const [key, heading] of managed) {
    if (active.has(key)) continue
    restoreHeading(heading)
    managed.delete(key)
  }
}

export const INSERT_EDITOR_TOC_COMMAND = createCommand<void>(
  "INSERT_EDITOR_TOC_COMMAND",
)

export const REMOVE_EDITOR_TOC_COMMAND = createCommand<void>(
  "REMOVE_EDITOR_TOC_COMMAND",
)

function $insertEditorToc() {
  const editor = $getEditor()
  const selection = $getSelection()

  if (!editor.isEditable() || !$isRangeSelection(selection)) return false
  $addUpdateTag(HISTORY_PUSH_TAG)
  const node = $createEditorTocNode()
  $insertNodeToNearestRootAtCaret(
    node,
    $caretFromPoint(selection.focus, "next"),
    { $shouldSplit: () => false },
  )

  if (!node.getNextSibling()) node.insertAfter($createParagraphNode())
  node.selectNext()

  return true
}

function $removeSelectedEditorToc() {
  const selection = $getSelection()

  if (!$isNodeSelection(selection) || !$getEditor().isEditable()) return false

  const node = selection
    .getNodes()
    .find((selected) => selected instanceof EditorTocNode)

  if (!(node instanceof EditorTocNode)) return false
  $addUpdateTag(HISTORY_PUSH_TAG)
  node.selectPrevious()
  node.remove()

  return true
}

export { EditorTocClipboardExtension } from "./toc-clipboard"

export const EditorTocExtension = defineExtension({
  name: "@yopem-ui/editor/toc",
  nodes: [EditorTocNode],
  dependencies: [EditorTocClipboardExtension],
  init(config) {
    config.html = createEditorTocHTMLConfig(config.html)
  },
  register(editor) {
    const managed = new Map<NodeKey, ManagedHeading>()

    function sync(state: EditorState) {
      syncHeadings(editor, state, managed)
    }

    function restoreAll() {
      for (const heading of managed.values()) restoreHeading(heading)
      managed.clear()
    }

    return mergeRegister(
      editor.registerRootListener((root, previous) => {
        if (previous) restoreAll()

        if (root) sync(editor.getEditorState())
      }),
      editor.registerUpdateListener(({ editorState }) => sync(editorState)),
      editor.registerCommand(
        INSERT_EDITOR_TOC_COMMAND,
        $insertEditorToc,
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        REMOVE_EDITOR_TOC_COMMAND,
        $removeSelectedEditorToc,
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          const removed = $removeSelectedEditorToc()

          if (removed) event?.preventDefault()

          return removed
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const removed = $removeSelectedEditorToc()

          if (removed) event?.preventDefault()

          return removed
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerMutationListener(HeadingNode, (mutations) => {
        for (const [key, mutation] of mutations) {
          if (mutation !== "destroyed") {
            const element = editor.getElementByKey(key)

            if (element && managed.has(key)) {
              const previous = managed.get(key)

              if (previous?.element !== element) {
                if (previous) restoreHeading(previous)
                managed.delete(key)
              }
            }
          }
        }
      }),
      restoreAll,
    )
  },
})
