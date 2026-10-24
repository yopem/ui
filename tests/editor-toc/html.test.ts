import { isElement } from "@editor/dom"
import { createEditorTocHTMLConfig } from "@editor/toc-html"
import { getEditorTocHeadingId } from "@editor/toc-runtime"
import { createHeadlessEditor } from "@lexical/headless"
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingNode,
} from "@lexical/rich-text"
import { expect, test } from "bun:test"
import { $createTextNode, $getRoot, type HTMLConfig } from "lexical"
import { parseHTML } from "linkedom"

for (const after of [
  "unchanged",
  "replacement",
  "null",
  "undefined",
] as const) {
  test(`TOC heading exports retain matching targets and ${after} host callbacks`, () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document")
    const { document } = parseHTML("<!doctype html><html><body></body></html>")
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: document,
    })

    try {
      const editor = createHeadlessEditor({
        namespace: "toc-export",
        nodes: [HeadingNode],
        onError(cause) {
          throw cause
        },
      })

      editor.update(
        () => {
          $getRoot().append(
            $createHeadingNode("h2").append($createTextNode("Target")),
          )
        },
        { discrete: true },
      )
      let calls = 0
      const exports: NonNullable<HTMLConfig["export"]> = new Map()
      exports.set(HeadingNode, () => ({
        element: document.createElement("h2"),
        after(element) {
          calls += 1

          if (after === "replacement") return document.createElement("h2")

          if (after === "null") return null

          if (after === "undefined") return undefined

          return element
        },
      }))
      const config = createEditorTocHTMLConfig({ export: exports })
      const exporter = config.export?.get(HeadingNode)

      if (!exporter) throw new Error("Missing heading exporter")
      editor.getEditorState().read(() => {
        const heading = $getRoot().getFirstChild()

        if (!$isHeadingNode(heading)) throw new Error("Missing heading")
        const output = exporter(editor, heading)
        const expectedId = getEditorTocHeadingId(editor, heading.getKey())
        expect(
          output.element && isElement(output.element)
            ? output.element.id
            : null,
        ).toBe(expectedId)
        const element = output.after?.(output.element)
        expect(calls).toBe(1)

        if (after === "null") expect(element).toBeNull()
        else if (after === "undefined") expect(element).toBeUndefined()
        else
          expect(element && isElement(element) ? element.id : null).toBe(
            expectedId,
          )
      })
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "document", descriptor)
      else Reflect.deleteProperty(globalThis, "document")
    }
  })
}
