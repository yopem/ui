import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  parseDocument,
  importDocument,
  exportDocument,
  DocumentError,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { $getRoot, $createParagraphNode } from "lexical"

function editor() {
  return createHeadlessEditor({
    namespace: "styles",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

test.each(["160px", "10em", "10rem", "0.5px"])(
  "canonical font bounds and IBM Plex Mono survive %s",
  (size) => {
    const instance = editor()
    importDocument(
      instance,
      `<p><span style='font-family: "IBM Plex Mono"; font-size: ${size}; color: var(--editor-foreground)'>Text</span></p>`,
      "html",
    )
    const baseline = instance.getEditorState().toJSON()

    for (const format of ["json", "html", "markdown"] as const)
      expect(parseDocument(exportDocument(instance, format), format)).toEqual(
        baseline,
      )
  },
)

test("unpersisted native element style fails before live replacement", () => {
  const instance = editor()

  const source = JSON.stringify(
    parseDocument(
      '<table><tr><td style="width: 160px"><p>Text</p></td></tr></table>',
      "html",
    ),
  ).replace(
    '"type":"tablecell"',
    '"style":"width: 120px; line-height: 2","type":"tablecell"',
  )

  importDocument(instance, "Before", "markdown")
  const before = instance.getEditorState()
  expect(() => importDocument(instance, source, "json")).toThrow(DocumentError)
  expect(instance.getEditorState()).toBe(before)
})

test.each([
  "data-editor-text-format='1'",
  "data-editor-text-style='color: red'",
  "data-editor-style='color: red'",
  "data-editor-state='{}'",
])("unsupported inline metadata diagnoses: %s", (attribute) => {
  expect(() =>
    parseDocument(`<p><span ${attribute}>Text</span></p>`, "html"),
  ).toThrow(DocumentError)
})

test("JSON fields native nodes cannot retain fail before live replacement", () => {
  const instance = editor()
  importDocument(instance, "Before", "markdown")
  const before = instance.getEditorState()

  const source = JSON.stringify(parseDocument("# Heading", "markdown")).replace(
    '"type":"heading"',
    '"textFormat":3,"type":"heading"',
  )

  expect(() => importDocument(instance, source, "json")).toThrow(DocumentError)
  expect(instance.getEditorState()).toBe(before)
})

test("unpersisted native element styles never disappear on export", () => {
  const instance = editor()
  instance.update(
    () => {
      $getRoot().append($createParagraphNode().setStyle("color: red"))
    },
    { discrete: true },
  )

  for (const format of ["json", "html", "markdown"] as const)
    expect(() => exportDocument(instance, format)).toThrow(DocumentError)
})
