import { $exportTree, createDocumentEditor } from "@editor/document/convert"
import {
  exportDocument,
  htmlDocument,
  importDocument,
} from "@yopem-ui/editor/document"
import { validateEditorTocHTML } from "@yopem-ui/editor/toc-model"
import { expect, test } from "bun:test"

function source(
  headingCount: number,
  tocCount: number,
  text = "x",
  format = 0,
) {
  const heading = {
    type: "heading",
    version: 1,
    tag: "h2",
    direction: null,
    format: "",
    indent: 0,
    children: text
      ? [
          {
            type: "text",
            version: 1,
            text,
            detail: 0,
            format,
            mode: "normal",
            style: "",
          },
        ]
      : [],
  }

  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        ...Array.from({ length: tocCount }, () => ({
          type: "editor-toc",
          version: 1,
        })),
        ...Array.from({ length: headingCount }, () => heading),
      ],
    },
  })
}

function open(input: string) {
  const editor = createDocumentEditor()
  importDocument(editor, input, "json")

  return editor
}

function tocHTML(headingCount: number, text: string) {
  const entries = Array.from(
    { length: headingCount },
    (_, index) =>
      `<li><a href="#yopem-toc-document-heading-${index + 1}">${text}</a></li>`,
  ).join("")

  return `<nav data-editor-toc><ol>${entries}</ol></nav>`
}

test("excessive heading and TOC products reject before conversion without changing state", () => {
  const editor = open(source(2000, 2000))
  const before = editor.getEditorState()
  const json = exportDocument(editor, "json")

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(editor, format)).toThrow(
      "Table of contents export exceeds structure budget.",
    )
  expect(() => htmlDocument(editor)).toThrow(
    "Table of contents export exceeds structure budget.",
  )
  expect(() => before.read(() => $exportTree(), { editor })).toThrow(
    "Table of contents export exceeds structure budget.",
  )
  expect(editor.getEditorState()).toBe(before)
  expect(exportDocument(editor, "json")).toBe(json)
  editor.dispose()
})

test("TOC HTML's 10000 node limit has a deterministic boundary", () => {
  expect(() => validateEditorTocHTML(tocHTML(3332, "x"))).not.toThrow()
  expect(() => validateEditorTocHTML(tocHTML(3333, "x"))).toThrow(
    "Table of contents HTML has too many nodes",
  )

  const valid = open(source(3332, 1))
  expect(valid.read(() => $exportTree()).children[0]).toMatchObject({
    tagName: "nav",
    children: [
      {
        tagName: "ol",
        children: expect.arrayContaining([
          expect.objectContaining({
            children: [
              expect.objectContaining({
                properties: { href: "#yopem-toc-document-heading-3332" },
              }),
            ],
          }),
        ]),
      },
    ],
  })
  valid.dispose()

  const invalid = open(source(3333, 1))
  const before = invalid.getEditorState()
  expect(() => exportDocument(invalid, "html")).toThrow(
    "Table of contents export exceeds 10000 HTML nodes.",
  )
  expect(invalid.getEditorState()).toBe(before)
  invalid.dispose()
})

test("empty heading labels count only nodes present in serialized TOC HTML", () => {
  expect(() => validateEditorTocHTML(tocHTML(4999, ""))).not.toThrow()
  expect(() => validateEditorTocHTML(tocHTML(5000, ""))).toThrow(
    "Table of contents HTML has too many nodes",
  )

  const valid = open(source(4999, 1, ""))
  expect(valid.read(() => $exportTree()).children[0]).toMatchObject({
    tagName: "nav",
    children: [
      {
        tagName: "ol",
        children: expect.arrayContaining([
          expect.objectContaining({
            children: [
              expect.objectContaining({
                properties: { href: "#yopem-toc-document-heading-4999" },
              }),
            ],
          }),
        ]),
      },
    ],
  })
  valid.dispose()

  const invalid = open(source(5000, 1, ""))
  const before = invalid.getEditorState()
  expect(() => exportDocument(invalid, "html")).toThrow(
    "Table of contents export exceeds 10000 HTML nodes.",
  )
  expect(invalid.getEditorState()).toBe(before)
  invalid.dispose()
})

test("complete HTML export respects the independent parsed structure budget", () => {
  const valid = open(source(2519, 1))
  expect(exportDocument(valid, "html")).toContain(
    'href="#yopem-toc-document-heading-2519"',
  )
  valid.dispose()

  const invalid = open(source(2520, 1))
  const before = invalid.getEditorState()
  const json = exportDocument(invalid, "json")
  expect(() => exportDocument(invalid, "html")).toThrow(
    "Document exceeds structure budget.",
  )
  expect(invalid.getEditorState()).toBe(before)
  expect(exportDocument(invalid, "json")).toBe(json)
  invalid.dispose()
})

test("escaped TOC output bytes are bounded before repeated entries are built", () => {
  const valid = open(source(1, 170, "&".repeat(1000)))
  expect(exportDocument(valid, "html")).toContain("&#x26;")
  valid.dispose()

  const invalid = open(source(1, 175, "&".repeat(1000)))
  const before = invalid.getEditorState()

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(invalid, format)).toThrow(
      "Table of contents export exceeds 1 MiB.",
    )
  expect(invalid.getEditorState()).toBe(before)
  invalid.dispose()
})
