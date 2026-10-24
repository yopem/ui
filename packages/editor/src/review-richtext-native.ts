import {
  $addUpdateTag,
  HISTORY_PUSH_TAG,
  $getRoot,
  $getState,
  $setState,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  defineExtension,
  mergeRegister,
  TextNode,
} from "lexical"

import { createEditorReviewRichHTMLConfig } from "./review-html"
import { editorReviewKeyboardState } from "./review-state"

export { editorReviewKeyboardState } from "./review-state"

export function $toggleEditorReviewKeyboard() {
  const range = $getSelection()

  if (!$isRangeSelection(range) || range.isCollapsed()) return false
  const nodes = range.extract().filter($isTextNode)

  if (!nodes.length) return false

  const next = !nodes.every((node) =>
    $getState(node, editorReviewKeyboardState),
  )

  $addUpdateTag(HISTORY_PUSH_TAG)

  for (const node of nodes) $setState(node, editorReviewKeyboardState, next)

  return true
}

export const EditorReviewRichTextExtension = defineExtension({
  name: "@yopem-ui/editor/review-richtext",
  config: { keyboardClassName: "" },
  init(config) {
    config.html = createEditorReviewRichHTMLConfig(config.html)
  },
  register(editor, config) {
    const classes = config.keyboardClassName.split(" ").filter(Boolean)
    const decorated = new Set<HTMLElement>()

    function refresh() {
      for (const element of decorated)
        if (!element.isConnected) {
          element.classList.remove(...classes)
          decorated.delete(element)
        }

      editor.getEditorState().read(() => {
        for (const node of $getRoot().getAllTextNodes()) {
          const element = editor.getElementByKey(node.getKey())

          if (!element) continue

          if ($getState(node, editorReviewKeyboardState)) {
            element.classList.add(...classes)
            decorated.add(element)
          } else if (decorated.delete(element))
            element.classList.remove(...classes)
        }
      })
    }

    return mergeRegister(
      editor.registerMutationListener(TextNode, refresh),
      editor.registerRootListener(refresh),
      () => {
        for (const element of decorated) element.classList.remove(...classes)
        decorated.clear()
      },
    )
  },
})
