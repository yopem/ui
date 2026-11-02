import { createDocumentEditor } from "@editor/document/convert"
import {
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

function block(type: string, children: object[]) {
  return { type, version: 1, direction: null, format: "", indent: 0, children }
}

function source(references: string[], definitions: string[]) {
  return JSON.stringify({
    root: block("root", [
      block(
        "paragraph",
        references.map((identifier) => ({
          type: "editor-footnote-reference",
          version: 1,
          identifier,
        })),
      ),
      ...definitions.map((identifier) => ({
        ...block("editor-footnote-definition", [block("paragraph", [])]),
        identifier,
      })),
    ]),
  })
}

function open(input: string) {
  const editor = createDocumentEditor()
  importDocument(editor, input, "json")

  return editor
}

function inputHTML(referenceCount: number, definitionCount: number) {
  return `<p>${'<sup data-editor-footnote-reference="note">1</sup>'.repeat(referenceCount)}</p>${'<div data-editor-footnote-definition="note"><p></p></div>'.repeat(definitionCount)}`
}

function backlinks(html: string) {
  const document = parseHTML(html).document

  return Array.from(
    document.querySelectorAll("[data-editor-footnote-definition]"),
    (definition) =>
      Array.from(
        definition.querySelectorAll("[data-editor-footnote-backlink]"),
        (link) => [link.getAttribute("href"), link.textContent],
      ),
  )
}

test("duplicate definitions and repeated references preserve every backlink and first-definition targets", () => {
  const editor = open(
    source(["note", "other", "note", "missing"], ["note", "other", "note"]),
  )

  const html = exportDocument(editor, "html")
  const document = parseHTML(html).document

  const references = Array.from(
    document.querySelectorAll("[data-editor-footnote-reference]"),
  )

  expect(
    references.map((reference) =>
      reference.querySelector("a")?.getAttribute("href"),
    ),
  ).toEqual([
    "#yopem-footnote-definition-note-1",
    "#yopem-footnote-definition-other-2",
    "#yopem-footnote-definition-note-1",
    undefined,
  ])
  expect(backlinks(html)).toEqual([
    [
      ["#yopem-footnote-reference-note-1", "↩ 1"],
      ["#yopem-footnote-reference-note-3", "↩ 3"],
    ],
    [["#yopem-footnote-reference-other-2", "↩ 2"]],
    [
      ["#yopem-footnote-reference-note-1", "↩ 1"],
      ["#yopem-footnote-reference-note-3", "↩ 3"],
    ],
  ])

  const expected = parseDocument(exportDocument(editor, "json"), "json")

  for (const format of ["html", "markdown"] as const) {
    const output = exportDocument(editor, format)
    expect(parseDocument(output, format)).toEqual(expected)
  }

  expect(
    backlinks(renderToStaticMarkup(createElement(DocumentStatic, { html }))),
  ).toEqual(backlinks(html))
  editor.dispose()
})

test("1000 references and 1000 duplicate definitions reject before backlink expansion", () => {
  const editor = open(
    source(Array(1000).fill("note"), Array(1000).fill("note")),
  )

  const before = editor.getEditorState()
  const json = exportDocument(editor, "json")

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(editor, format)).toThrow(
      "Footnote export exceeds structure budget.",
    )
  expect(() => htmlDocument(editor)).toThrow(
    "Footnote export exceeds structure budget.",
  )
  expect(editor.getEditorState()).toBe(before)
  expect(exportDocument(editor, "json")).toBe(json)
  editor.dispose()

  const html = inputHTML(1000, 1000)
  expect(() => parseDocument(html, "html")).toThrow(
    "Footnote export exceeds structure budget.",
  )
  expect(() =>
    renderToStaticMarkup(createElement(DocumentStatic, { html })),
  ).toThrow("Footnote export exceeds structure budget.")
})

test("output byte and structure limits reject without changing the source editor", () => {
  const identifier = "a".repeat(64)

  const editor = open(
    source(Array(110).fill(identifier), Array(110).fill(identifier)),
  )

  const before = editor.getEditorState()
  const json = exportDocument(editor, "json")

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(editor, format)).toThrow(
      "Footnote export exceeds 1 MiB.",
    )
  expect(() => htmlDocument(editor)).toThrow("Footnote export exceeds 1 MiB.")
  expect(editor.getEditorState()).toBe(before)
  expect(exportDocument(editor, "json")).toBe(json)
  editor.dispose()
})

test("malformed and over-limit imports do not replace existing state", () => {
  const editor = open(source(["note"], ["note"]))
  const before = editor.getEditorState()
  const json = exportDocument(editor, "json")

  for (const [input, format] of [
    [inputHTML(1000, 1000), "html"],
    ['<sup data-editor-footnote-reference="!">1</sup>', "html"],
    ["x".repeat(1_048_577), "markdown"],
  ] as const) {
    expect(() => importDocument(editor, input, format)).toThrow()
    expect(editor.getEditorState()).toBe(before)
    expect(exportDocument(editor, "json")).toBe(json)
  }

  editor.dispose()
})
