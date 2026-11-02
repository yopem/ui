import { exportDocx } from "@editor/docx"
import { createHeadlessEditor } from "@lexical/headless"
import { $createQuoteNode } from "@lexical/rich-text"
import {
  documentNodes,
  DocumentError,
  downloadDocument,
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, spyOn, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSlot,
} from "lexical"
import { parseHTML } from "linkedom"

const diagnostic = "Portable export cannot retain paragraph slots."

function editor() {
  return createHeadlessEditor({
    namespace: "paragraph-slot-export-guard",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

function selection() {
  const current = $getSelection()

  if (!$isRangeSelection(current)) return null

  return {
    anchor: {
      key: current.anchor.key,
      offset: current.anchor.offset,
      type: current.anchor.type,
    },
    focus: {
      key: current.focus.key,
      offset: current.focus.offset,
      type: current.focus.type,
    },
  }
}

for (const location of ["direct", "nested"] as const) {
  for (const sameNameRoot of [false, true]) {
    test(`rejects ${location} paragraph slot with same-name root: ${sameNameRoot}`, () => {
      const instance = editor()
      let textKey = ""
      instance.update(
        () => {
          const text = $createTextNode("Selected content")
          textKey = text.getKey()
          const root = $getRoot()
          const paragraph = $createParagraphNode().append(text)

          const owner =
            location === "direct"
              ? paragraph
              : $createParagraphNode().append($createTextNode("Nested"))

          $setSlot(
            owner,
            "note",
            $createParagraphNode().append($createTextNode("Slot content")),
          )

          root.append(paragraph)

          if (location === "nested")
            $setSlot(
              root,
              sameNameRoot ? "note" : "outer",
              $createQuoteNode().append(owner),
            )
          else if (sameNameRoot)
            $setSlot(
              root,
              "note",
              $createParagraphNode().append($createTextNode("Root slot")),
            )

          text.select(1, 6)
        },
        { discrete: true },
      )
      const state = instance.getEditorState()
      const before = state.toJSON()
      const beforeSelection = state.read(selection)
      expect(beforeSelection).toEqual({
        anchor: { key: textKey, offset: 1, type: "text" },
        focus: { key: textKey, offset: 6, type: "text" },
      })
      const json = exportDocument(instance, "json")
      expect(JSON.parse(json)).toEqual(before)
      expect(parseDocument(json, "json")).toEqual(before)
      const target = editor()
      importDocument(target, json, "json")
      expect(target.getEditorState().toJSON()).toEqual(before)

      const ownerDocument = parseHTML(
        "<!doctype html><html><body></body></html>",
      ).document

      const createURL = spyOn(URL, "createObjectURL")
      const createElement = spyOn(ownerDocument, "createElement")

      try {
        for (const action of [
          () => exportDocument(instance, "html"),
          () => exportDocument(instance, "markdown"),
          () => htmlDocument(instance),
          () => downloadDocument(instance, "html", ownerDocument),
          () => downloadDocument(instance, "markdown", ownerDocument),
          () => exportDocx(instance),
        ]) {
          try {
            action()
            throw new Error("Portable output was produced")
          } catch (error) {
            expect(error).toBeInstanceOf(DocumentError)
            expect(error instanceof DocumentError && error.diagnostics).toEqual(
              [diagnostic],
            )
          }

          expect(instance.getEditorState()).toBe(state)
          expect(instance.getEditorState().toJSON()).toEqual(before)
          expect(instance.getEditorState().read(selection)).toEqual(
            beforeSelection,
          )
        }

        expect(createURL).not.toHaveBeenCalled()
        expect(createElement).not.toHaveBeenCalled()
      } finally {
        createURL.mockRestore()
        createElement.mockRestore()
      }
    })
  }
}

test("legacy direct root and quote wrappers remain parent-owned", () => {
  const html =
    '<p>Host</p><div data-editor-slot="note"><p>Root</p></div><blockquote><p>Quote</p><div data-editor-slot="note"><p>Nested</p></div></blockquote>'

  const expected = parseDocument(html, "html")
  expect(expected.root.$slots?.note).toBeDefined()
  expect(expected.root.children[1]?.$slots?.note).toBeDefined()
  const instance = editor()
  importDocument(instance, html, "html")

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(instance, format), format)).toEqual(
      expected,
    )

  expect(htmlDocument(instance)).toContain("Host")
})
