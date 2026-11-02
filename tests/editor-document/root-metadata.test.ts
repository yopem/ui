import { createHeadlessEditor } from "@lexical/headless"
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
} from "lexical"
import { parseHTML } from "linkedom"

const diagnostic = "Portable export cannot retain root metadata."

function editor() {
  return createHeadlessEditor({
    namespace: "root-metadata",
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

const cases = [
  ...(["left", "right", "center", "justify", "start", "end"] as const).map(
    (format) => ({ format, direction: null, indent: 0 }),
  ),
  { format: "", direction: "ltr", indent: 0 },
  { format: "", direction: "rtl", indent: 0 },
  { format: "", direction: null, indent: 1 },
  { format: "", direction: null, indent: 64 },
  { format: "start", direction: "rtl", indent: 1 },
  { format: "end", direction: "rtl", indent: 64 },
] as const

for (const metadata of cases) {
  test(`nondefault root metadata fails closed: ${JSON.stringify(metadata)}`, () => {
    const instance = editor()
    let textKey = ""
    instance.update(
      () => {
        const text = $createTextNode("Content")
        textKey = text.getKey()
        const root = $getRoot()
        root.append($createParagraphNode().append(text))
        root.setFormat(metadata.format)
        root.setDirection(metadata.direction)
        root.setIndent(metadata.indent)
        text.select(1, 4)
      },
      { discrete: true },
    )
    const state = instance.getEditorState()
    const before = state.toJSON()
    const beforeSelection = state.read(selection)
    expect(beforeSelection).toEqual({
      anchor: { key: textKey, offset: 1, type: "text" },
      focus: { key: textKey, offset: 4, type: "text" },
    })
    const json = exportDocument(instance, "json")
    expect(JSON.parse(json)).toEqual(before)
    expect(parseDocument(json, "json")).toEqual(before)
    const target = editor()
    importDocument(target, json, "json")
    expect(target.getEditorState().toJSON()).toEqual(before)
    expect(before.root).toMatchObject(metadata)

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
      ]) {
        try {
          action()
          throw new Error("Portable output was produced")
        } catch (error) {
          expect(error).toBeInstanceOf(DocumentError)
          expect(error instanceof DocumentError && error.diagnostics).toEqual([
            diagnostic,
          ])
        }

        expect(instance.getEditorState()).toBe(state)
        expect(instance.getEditorState().read(selection)).toEqual(
          beforeSelection,
        )
      }

      expect(createURL).not.toHaveBeenCalled()
      expect(createElement).not.toHaveBeenCalled()
      expect(instance.getEditorState()).toBe(state)
      expect(instance.getEditorState().toJSON()).toEqual(before)
      expect(instance.getEditorState().read(selection)).toEqual(beforeSelection)
    } finally {
      createURL.mockRestore()
      createElement.mockRestore()
    }
  })
}

test("default root metadata retains existing portable import and export", () => {
  const instance = editor()
  importDocument(instance, "<p>Content</p>", "html")
  const before = instance.getEditorState().toJSON()
  expect(before.root).toMatchObject({ format: "", direction: null, indent: 0 })

  for (const format of ["html", "markdown"] as const) {
    const output = exportDocument(instance, format)
    expect(parseDocument(output, format)).toEqual(before)
    const target = editor()
    importDocument(target, output, format)
    expect(target.getEditorState().toJSON()).toEqual(before)
  }

  expect(htmlDocument(instance)).toContain("Content")
  expect(instance.getEditorState().toJSON()).toEqual(before)
})

test("native style safety still applies to JSON and portable output", () => {
  const instance = editor()
  instance.update(
    () => {
      const root = $getRoot()
      root.append($createParagraphNode().append($createTextNode("Content")))
      root.setFormat("center")
      root.setStyle("color: red")
    },
    { discrete: true },
  )
  const before = instance.getEditorState()

  for (const format of ["json", "html", "markdown"] as const)
    expect(() => exportDocument(instance, format)).toThrow(
      "Unpersisted native element style cannot be exported.",
    )
  expect(() => htmlDocument(instance)).toThrow(
    "Unpersisted native element style cannot be exported.",
  )
  expect(instance.getEditorState()).toBe(before)
})
