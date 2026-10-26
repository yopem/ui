import type { BaseSelection, LexicalEditor, LexicalNode } from "lexical"

import { $insertGeneratedNodes } from "@lexical/clipboard"
import { $createParagraphNode } from "lexical"

export function $insertDocumentNodes(
  editor: LexicalEditor,
  nodes: LexicalNode[],
  selection: BaseSelection,
) {
  if (nodes[0]?.getType() === "paragraph") {
    $insertGeneratedNodes(editor, nodes, selection)

    return
  }

  const boundary = $createParagraphNode()
  $insertGeneratedNodes(editor, [boundary, ...nodes], selection)

  if (boundary.isAttached()) boundary.remove()
}
