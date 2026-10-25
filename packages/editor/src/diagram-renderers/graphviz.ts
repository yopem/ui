import { Graphviz } from "@hpcc-js/wasm-graphviz"
import {
  assertEditorDiagramRenderActive,
  type EditorDiagramRenderInput,
} from "@yopem-ui/editor/diagram/render"

export async function editorDiagramGraphvizRenderer(
  input: EditorDiagramRenderInput,
) {
  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
  const graphviz = await Graphviz.load()
  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)
  const svg = graphviz.layout(input.source, "svg_inline", "dot")
  assertEditorDiagramRenderActive(input.signal, input.deadlineAt)

  return svg
}
