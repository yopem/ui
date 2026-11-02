import { EditorTocNode } from "@editor/toc-node"
import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  exportDocument,
  importDocument,
} from "@yopem-ui/editor/document"

export function createStaticTocFixture(count: number) {
  const editor = createHeadlessEditor({
    namespace: "static-toc-fixture",
    nodes: [...documentNodes, EditorTocNode],
    onError(error) {
      throw error
    },
  })

  const toc = { type: "editor-toc", version: 1 }

  const heading = (text: string) => ({
    type: "heading",
    version: 1,
    tag: "h2",
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "text",
        version: 1,
        text,
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      },
    ],
  })

  const root = {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [
      toc,
      heading("First section"),
      {
        type: "quote",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [heading("Nested section")],
      },
      ...Array.from({ length: Math.max(0, count - 2) }, () => toc),
    ],
  }

  if (count > 1) Object.assign(root, { $slots: { contents: toc } })

  const document = JSON.stringify({ root })

  importDocument(editor, document, "json")

  return { editor, html: exportDocument(editor, "html") }
}
