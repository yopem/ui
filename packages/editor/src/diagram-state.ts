import { $createCodeNode, type CodeNode } from "@lexical/code"
import { $createTextNode, $getState, $setState, createState } from "lexical"

import { $getSelectedCode } from "./code-model"
import {
  createEditorDiagramMetadata,
  editorDiagramStateSchema,
  parseEditorDiagramMetadata,
  validateEditorDiagramSource,
  type EditorDiagramKind,
  type EditorDiagramMetadata,
  type EditorDiagramViewMode,
} from "./diagram-model"

export const editorDiagramState = createState("editorDiagram", {
  parse: (input) => editorDiagramStateSchema.parse(input),
})

export function $getSelectedEditorDiagram() {
  const code = $getSelectedCode()

  return code && $getState(code, editorDiagramState) ? code : null
}

export function $createEditorDiagramCodeNode(
  kind: EditorDiagramKind,
  source: string,
  viewMode: EditorDiagramViewMode = "both",
): CodeNode {
  validateEditorDiagramSource(source)

  const code = $createCodeNode(kind)
  $setState(
    code,
    editorDiagramState,
    createEditorDiagramMetadata(kind, viewMode),
  )
  code.append($createTextNode(source))

  return code
}

export function $setEditorDiagramMetadata(
  code: CodeNode,
  value: EditorDiagramMetadata | null,
) {
  const metadata = value === null ? null : parseEditorDiagramMetadata(value)

  if (value !== null && !metadata)
    throw new Error("Diagram metadata is invalid.")

  $setState(code, editorDiagramState, metadata)

  if (metadata) code.setLanguage(metadata.kind)
}
