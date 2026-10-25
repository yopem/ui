import {
  assertEditorDiagramRenderActive,
  type EditorDiagramRenderInput,
} from "@yopem-ui/editor/diagram/render"
import flowchart from "flowchart.js"

import { assertFlowchartSourcePolicy } from "./source-policy"

export function editorDiagramFlowchartRenderer(
  input: EditorDiagramRenderInput,
) {
  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
  assertFlowchartSourcePolicy(input.source)

  if (typeof document === "undefined" || !document.body)
    throw new Error("Flowchart rendering requires a mounted browser DOM.")

  const container = document.createElement("div")
  const chart = flowchart.parse(input.source)
  container.inert = true
  container.setAttribute("aria-hidden", "true")
  container.style.position = "fixed"
  container.style.insetInlineStart = "-100000px"
  container.style.visibility = "hidden"
  container.style.pointerEvents = "none"
  document.body.append(container)

  try {
    assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
    chart.drawSVG(container)
    assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
    const svg = container.querySelector("svg")

    if (!svg) throw new Error("Flowchart renderer did not produce SVG.")

    return svg.outerHTML
  } finally {
    try {
      if (container.firstChild) chart.clean()
    } finally {
      container.remove()
    }
  }
}
