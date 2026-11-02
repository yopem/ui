import { $createEditorMathNode } from "@editor/math-node"
import { $createEditorTocNode, EditorTocNode } from "@editor/toc-node"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import {
  $createHeadingNode,
  $createQuoteNode,
  registerRichText,
} from "@lexical/rich-text"
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
} from "@lexical/table"
import {
  documentNodes,
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
  type DocumentFormat,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSlot,
  createEditor,
} from "lexical"
import { createElement } from "react"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"

function paragraph(value: string) {
  return $createParagraphNode().append($createTextNode(value))
}

function heading(value: string) {
  return $createHeadingNode("h2").append($createTextNode(value))
}

const editor = createEditor({
  namespace: "slot-sidecar-fixture",
  nodes: [...documentNodes, EditorTocNode],
  onError(error) {
    throw error
  },
})

const editable = document.getElementById("editable")

const staticHost = document.getElementById("static")

if (!editable || !staticHost) throw new Error("Missing fixture roots")

registerRichText(editor)

registerHistory(editor, createEmptyHistoryState(), 300)

editor.setRootElement(editable)

const staticRoot = createRoot(staticHost)

function seed() {
  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      const host = paragraph("Host paragraph")
      const slot = paragraph("Paragraph slot")
      $setSlot(slot, "note", heading("Nested heading"))
      $setSlot(host, "note", slot)
      const nestedToc = $createEditorTocNode()
      $setSlot(nestedToc, "note", heading("Nested TOC heading"))
      $setSlot(host, "contents", nestedToc)
      const cell = $createTableCellNode().append(paragraph("Table cell"))
      const row = $createTableRowNode().append(cell)
      const table = $createTableNode().append(row)
      $setSlot(table, "note", paragraph("Table slot"))
      $setSlot(row, "note", paragraph("Row slot"))
      $setSlot(cell, "note", heading("Cell heading"))
      const toc = $createEditorTocNode()
      $setSlot(toc, "note", heading("TOC heading"))
      const math = $createEditorMathNode({ kind: "block", tex: "x+1" })
      $setSlot(math, "note", heading("Math heading"))
      $setSlot(root, "note", heading("Root heading"))
      root.append(host, table, toc, math, heading("Final heading"))
    },
    { discrete: true },
  )
}

function seedParagraphGuard(location: "direct" | "nested") {
  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      const host = paragraph("Host paragraph")
      const owner = location === "direct" ? host : paragraph("Nested owner")
      $setSlot(owner, "note", paragraph("Slot content"))
      $setSlot(
        root,
        "note",
        location === "nested"
          ? $createQuoteNode().append(owner)
          : paragraph("Root slot"),
      )
      root.append(host)
    },
    { discrete: true },
  )
}

let savedState = editor.getEditorState()

function snapshot() {
  return editor.getEditorState().read(() => {
    const selection = $getSelection()

    return {
      document: editor.getEditorState().toJSON(),
      selection: $isRangeSelection(selection)
        ? {
            anchor: {
              key: selection.anchor.key,
              offset: selection.anchor.offset,
              type: selection.anchor.type,
            },
            focus: {
              key: selection.focus.key,
              offset: selection.focus.offset,
              type: selection.focus.type,
            },
            backward: selection.isBackward(),
          }
        : null,
      domSelection: window.getSelection()?.toString() ?? "",
    }
  })
}

export interface SlotFixture {
  seed(): void
  seedParagraphGuard(location: "direct" | "nested"): void
  saveState(): void
  hasSavedState(): boolean
  snapshot(): ReturnType<typeof snapshot>
  export(format: DocumentFormat): string
  parse(source: string, format: DocumentFormat): object
  import(source: string, format: DocumentFormat): void
  editable(value: boolean): void
  standalone(): string
  renderStatic(source: string): void
}

const fixture: SlotFixture = {
  seed,
  seedParagraphGuard,
  saveState() {
    savedState = editor.getEditorState()
  },
  hasSavedState() {
    return editor.getEditorState() === savedState
  },
  snapshot,
  export(format) {
    return exportDocument(editor, format)
  },
  parse(source, format) {
    return parseDocument(source, format)
  },
  import(source, format) {
    importDocument(editor, source, format)
  },
  editable(value) {
    editor.setEditable(value)
  },
  standalone() {
    return htmlDocument(editor, "Slot fixture")
  },
  renderStatic(source) {
    flushSync(() => {
      staticRoot.render(
        createElement(
          "div",
          null,
          createElement(DocumentStatic, {
            html: source,
            idPrefix: "first",
            "aria-label": "First document",
          }),
          createElement(DocumentStatic, {
            html: source,
            idPrefix: "second",
            "aria-label": "Second document",
          }),
        ),
      )
    })
  },
}

Object.assign(window, { slotFixture: fixture })

if (!editable.hasAttribute("data-empty")) seed()
