import { EditorTocNode } from "@editor/toc-node"
import {
  documentNodes,
  exportDocument,
  importDocument,
} from "@yopem-ui/editor/document"
import { createEditor } from "lexical"

const count = Number(process.argv[2])

if (count !== 1 && count !== 2)
  throw new Error("Expected one or two contents nodes")

const editor = createEditor({
  namespace: "toc-export-acceptance",
  nodes: [...documentNodes, EditorTocNode],
  onError(error) {
    throw error
  },
})

const toc = { type: "editor-toc", version: 1 }

const heading = {
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
      text: "Exported section",
      detail: 0,
      format: 0,
      mode: "normal",
      style: "",
    },
  ],
}

const json = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: count === 1 ? [toc, heading] : [toc, heading, toc],
  },
})

importDocument(editor, json, "json")

process.stdout.write(exportDocument(editor, "html"))
