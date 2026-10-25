import "./plantuml-types.js"
import { renderToString } from "@plantuml/core"
import {
  assertEditorDiagramRenderActive,
  type EditorDiagramRenderInput,
} from "@yopem-ui/editor/diagram/render"

import { assertPlantUmlSourcePolicy } from "./source-policy"

export function editorDiagramPlantUmlRenderer(input: EditorDiagramRenderInput) {
  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
  assertPlantUmlSourcePolicy(input.source)

  return new Promise<string>((resolve, reject) => {
    assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
    renderToString(
      input.source.split(/\r\n|\r|\n/u),
      (svg) => {
        try {
          assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
          resolve(svg)
        } catch (cause) {
          reject(
            cause instanceof Error
              ? cause
              : new Error("Diagram rendering failed.", { cause }),
          )
        }
      },
      (message) => reject(new Error(message)),
      { maxSvgSize: 4096 },
    )
  })
}
