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
  const root = /^(?:\s|<!--[\s\S]*?-->|<\?[\s\S]*?\?>)*<svg\b/u.exec(svg)

  if (!root) return svg

  const tagEnd = svg.indexOf(">", root[0].length)

  if (/\sxmlns=/u.test(svg.slice(root[0].length, tagEnd))) return svg

  return svg.replace(root[0], '<svg xmlns="http://www.w3.org/2000/svg"')
}
