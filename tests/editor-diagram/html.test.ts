import type { DOMExportOutput, LexicalNode } from "lexical"

import { createEditorDiagramHTMLConfig } from "@editor/diagram-html"
import { createEditorDiagramMetadata } from "@editor/diagram-model"
import { $setEditorDiagramMetadata } from "@editor/diagram-state"
import { $createCodeNode, CodeNode } from "@lexical/code"
import { afterEach, beforeEach, expect, test } from "bun:test"
import { $createTextNode, $getRoot, createEditor } from "lexical"
import { DOMParser } from "linkedom"

const previousDocument = globalThis.document

beforeEach(() => {
  Reflect.set(
    globalThis,
    "document",
    new DOMParser().parseFromString("<html><body></body></html>", "text/html"),
  )
})

afterEach(() => {
  Reflect.set(globalThis, "document", previousDocument)
})

for (const result of ["element", "null", "undefined"] as const) {
  test(`preserves native diagram export callback binding and ${result} output`, () => {
    const editor = createEditor({
      namespace: "diagram-html-callback",
      nodes: [CodeNode],
      onError(cause) {
        throw cause
      },
    })

    let calls = 0

    editor.update(
      () => {
        const node = $createCodeNode("mermaid")
        node.append($createTextNode("flowchart LR\nA --> B"))
        $getRoot().append(node)
        $setEditorDiagramMetadata(node, createEditorDiagramMetadata("mermaid"))
        const element = document.createElement("pre")

        const html = createEditorDiagramHTMLConfig({
          export: new Map([
            [
              CodeNode,
              () => ({
                element,
                after(
                  this: LexicalNode,
                  output: DOMExportOutput["element"] | undefined,
                ) {
                  expect(this).toBe(node)
                  calls++

                  if (result === "null") return null

                  if (result === "undefined") return undefined

                  return output
                },
              }),
            ],
          ]),
        })

        const exporter = html.export?.get(CodeNode)
        expect(exporter).toBeDefined()

        if (!exporter) throw new Error("Diagram exporter is missing.")
        const output = exporter(editor, node)
        const rendered = output.after?.call(node, output.element)
        expect(calls).toBe(1)

        if (result === "element") {
          expect(rendered).toBe(element)
          expect(element.getAttribute("data-editor-diagram-kind")).toBe(
            "mermaid",
          )
        } else if (result === "null") expect(rendered).toBeNull()
        else expect(rendered).toBeUndefined()
      },
      { discrete: true },
    )
  })
}
