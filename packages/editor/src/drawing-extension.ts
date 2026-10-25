import { defineExtension } from "lexical"

import { EditorDrawingNode } from "./drawing-node"

export const EditorDrawingExtension = defineExtension({
  name: "@yopem-ui/editor/drawing",
  nodes: [EditorDrawingNode],
})
