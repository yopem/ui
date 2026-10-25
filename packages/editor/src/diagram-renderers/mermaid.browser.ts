import { EDITOR_DIAGRAM_MAX_SOURCE_BYTES } from "@yopem-ui/editor/diagram/model"
import {
  assertEditorDiagramRenderActive,
  type EditorDiagramRenderInput,
} from "@yopem-ui/editor/diagram/render"
import mermaid from "mermaid"

import { assertMermaidSourcePolicy } from "./source-policy"

export async function editorDiagramMermaidRenderer(
  input: EditorDiagramRenderInput,
) {
  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
  const { source } = input
  assertMermaidSourcePolicy(source)

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    htmlLabels: false,
    maxTextSize: EDITOR_DIAGRAM_MAX_SOURCE_BYTES,
    secure: [
      "secure",
      "securityLevel",
      "startOnLoad",
      "maxTextSize",
      "suppressErrorRendering",
      "maxEdges",
      "htmlLabels",
      "themeCSS",
    ],
  })

  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)

  const result = await mermaid.render(
    `yopem-editor-diagram-${crypto.randomUUID()}`,
    source,
  )

  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)

  return result.svg
}
