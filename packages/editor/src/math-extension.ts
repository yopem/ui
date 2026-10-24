import { $insertNodeToNearestRoot } from "@lexical/utils"
import {
  $createNodeSelection,
  $addUpdateTag,
  HISTORY_PUSH_TAG,
  $getNearestNodeFromDOMNode,
  $getEditor,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  $createParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  defineExtension,
  mergeRegister,
} from "lexical"

import { parseEditorMath, type EditorMathValue } from "./math-model"
import { EditorMathNode, $createEditorMathNode } from "./math-node"

export function $getSelectedEditorMath() {
  const selection = $getSelection()

  if (!$isNodeSelection(selection)) return null
  const nodes = selection.getNodes()

  return nodes.length === 1 && nodes[0] instanceof EditorMathNode
    ? nodes[0]
    : null
}

export function $insertEditorMath(value: EditorMathValue) {
  if (!$getEditor().isEditable()) return false

  const math = parseEditorMath(value)
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return false
  const node = $createEditorMathNode(math)

  if (math.kind === "inline") selection.insertNodes([node])
  else {
    $insertNodeToNearestRoot(node)
    node.insertAfter($createParagraphNode())
  }

  const selected = $createNodeSelection()
  selected.add(node.getKey())
  $setSelection(selected)

  return true
}

export const EditorMathExtension = defineExtension({
  name: "@yopem-ui/editor/math",
  nodes: [EditorMathNode],
  register(editor) {
    function select(event: Event) {
      const target = event.target

      if (!(target instanceof Element)) return
      const element = target.closest("[data-editor-math]")

      if (!element) return
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(element)

        if (!(node instanceof EditorMathNode)) return
        const selection = $createNodeSelection()
        selection.add(node.getKey())
        $setSelection(selection)
      })
    }

    function remove(event: KeyboardEvent | null) {
      if (!editor.isEditable()) return false
      const node = $getSelectedEditorMath()

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
      editor.registerCommand(KEY_DELETE_COMMAND, remove, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        remove,
        COMMAND_PRIORITY_LOW,
      ),
    )
  },
})
