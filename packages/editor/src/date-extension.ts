import type { LexicalEditor, LexicalNode, SerializedLexicalNode } from "lexical"

import {
  $addUpdateTag,
  $createNodeSelection,
  $getEditor,
  $getNearestNodeFromDOMNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $nodesOfType,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  defineExtension,
  HISTORY_PUSH_TAG,
  isCurrentlyReadOnlyMode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  mergeRegister,
  RootNode,
} from "lexical"

import {
  EDITOR_DATE_MAX_DEPTH,
  EDITOR_DATE_MAX_NODES,
  parseEditorDate,
  validateEditorDateJSON,
  type EditorDateValue,
} from "./date-model"
import { $createEditorDateNode, EditorDateNode } from "./date-node"

export const INSERT_EDITOR_DATE_COMMAND = createCommand<EditorDateValue>(
  "INSERT_EDITOR_DATE_COMMAND",
)

export const EDITOR_DATE_ERROR_COMMAND = createCommand<Error>(
  "EDITOR_DATE_ERROR_COMMAND",
)

class EditorDateError extends Error {}

export function $getSelectedEditorDate() {
  const selection = $getSelection()

  if (!$isNodeSelection(selection)) return null
  const nodes = selection.getNodes()

  return nodes.length === 1 && nodes[0] instanceof EditorDateNode
    ? nodes[0]
    : null
}

export function $insertEditorDate(value: EditorDateValue) {
  if (!$getEditor().isEditable() || isCurrentlyReadOnlyMode()) return false
  const date = parseEditorDate(value)
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return false
  const node = $createEditorDateNode(date)

  selection.insertNodes([node])
  const selected = $createNodeSelection()
  selected.add(node.getKey())
  $setSelection(selected)

  return true
}

export function registerEditorDateValidation(editor: LexicalEditor) {
  return editor.registerNodeTransform(RootNode, () => {
    if ($nodesOfType(EditorDateNode).length === 0) return
    let count = 0

    function serialize(
      node: LexicalNode,
      depth: number,
    ): SerializedLexicalNode & { children?: SerializedLexicalNode[] } {
      if (depth > EDITOR_DATE_MAX_DEPTH || ++count > EDITOR_DATE_MAX_NODES)
        throw new EditorDateError("Editor date document exceeds limits")
      const value = node.exportJSON()

      if (!$isElementNode(node)) return value
      const children = node.getChildren()

      if (children.length + count > EDITOR_DATE_MAX_NODES)
        throw new EditorDateError("Editor date document exceeds limits")

      return {
        ...value,
        children: children.map((child) => serialize(child, depth + 1)),
      }
    }

    try {
      validateEditorDateJSON({ root: serialize($getRoot(), 0) })
    } catch {
      throw new EditorDateError("Invalid editor date state")
    }
  })
}

export const EditorDateExtension = defineExtension({
  name: "@yopem-ui/editor/date",
  nodes: [EditorDateNode],
  init(editorConfig) {
    const previousError = editorConfig.onError

    editorConfig.onError = (error, editor) => {
      if (error instanceof EditorDateError) {
        queueMicrotask(() => {
          editor.dispatchCommand(EDITOR_DATE_ERROR_COMMAND, error)
        })

        return
      }

      if (previousError) previousError(error, editor)
      else throw error
    }
  },
  register(editor) {
    function select(event: Event) {
      const target = event.target

      if (!(target instanceof Element)) return
      const element = target.closest('[data-editor-date="1"]')

      if (!element) return
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(element)

        if (!(node instanceof EditorDateNode)) return
        const selection = $createNodeSelection()
        selection.add(node.getKey())
        $setSelection(selection)
      })
    }

    function remove(event: KeyboardEvent | null) {
      if (!editor.isEditable() || isCurrentlyReadOnlyMode()) return false
      const node = $getSelectedEditorDate()

      if (!node) return false
      event?.preventDefault()
      $addUpdateTag(HISTORY_PUSH_TAG)
      node.selectPrevious()
      node.remove()

      return true
    }

    return mergeRegister(
      editor.registerRootListener((root, previous) => {
        previous?.removeEventListener("click", select)
        previous?.removeEventListener("focusin", select)
        root?.addEventListener("click", select)
        root?.addEventListener("focusin", select)
      }),
      registerEditorDateValidation(editor),
      editor.registerCommand(
        INSERT_EDITOR_DATE_COMMAND,
        (date) => {
          if (!editor.isEditable() || isCurrentlyReadOnlyMode()) return false
          $addUpdateTag(HISTORY_PUSH_TAG)

          return $insertEditorDate(date)
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, remove, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        remove,
        COMMAND_PRIORITY_LOW,
      ),
    )
  },
})
