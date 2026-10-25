import { $isCodeNode } from "@lexical/code"
import { $getSelection, $isRangeSelection } from "lexical"

export function $getSelectedCode() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor.getNode()
  const focus = selection.focus.getNode()
  const code = $isCodeNode(anchor) ? anchor : anchor.getParent()
  const end = $isCodeNode(focus) ? focus : focus.getParent()

  return $isCodeNode(code) && code === end ? code : null
}
