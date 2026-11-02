import { $createMediaNode } from "@editor/media/model"
import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  exportDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $setSlot,
  type LexicalNode,
} from "lexical"

function editor() {
  return createHeadlessEditor({
    namespace: "portable-slot-ownership",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

function findNode(node: LexicalNode, type: string): LexicalNode | undefined {
  if (node.getType() === type) return node

  if (!$isElementNode(node)) return undefined

  for (const child of node.getChildren()) {
    const match = findNode(child, type)

    if (match) return match
  }
}

const hosts = [
  { type: "paragraph", source: "Host paragraph" },
  { type: "heading", source: "## Host heading" },
  { type: "list", source: "- Host item" },
  { type: "listitem", source: "- Host item" },
  { type: "table", source: "| Host |\n| --- |\n| Cell |" },
  { type: "tablerow", source: "| Host |\n| --- |\n| Cell |" },
  { type: "tablecell", source: "| Host |\n| --- |\n| Cell |" },
] as const

for (const host of hosts) {
  test(`${host.type} slot owner round trips without changing ownership`, () => {
    const original = editor()
    importDocument(original, host.source, "markdown")
    original.update(
      () => {
        const owner = findNode($getRoot(), host.type)

        if (!owner || !$isElementNode(owner)) throw new Error("Missing owner.")

        const first = $createParagraphNode().append($createTextNode("First"))
        $setSlot(owner, "note", first)
        $setSlot(
          owner,
          "other",
          $createParagraphNode().append($createTextNode("Second")),
        )
        $setSlot(
          $getRoot(),
          "note",
          $createParagraphNode().append($createTextNode("Root")),
        )
      },
      { discrete: true },
    )
    const expected = parseDocument(exportDocument(original, "json"), "json")

    for (const format of ["html", "markdown"] as const) {
      const output = exportDocument(original, format)
      expect(parseDocument(output, format)).toEqual(expected)
      const target = editor()
      importDocument(target, output, format)
      expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
        expected,
      )
    }

    expect(original.getEditorState().toJSON()).toEqual(expected)
  })
}

test("paragraph slot does not become a root slot", () => {
  const original = editor()
  importDocument(original, "Host", "markdown")
  original.update(
    () => {
      const owner = $getRoot().getFirstChild()

      if (!owner || !$isElementNode(owner)) throw new Error("Missing owner.")

      $setSlot(
        owner,
        "note",
        $createParagraphNode().append($createTextNode("Slot")),
      )
    },
    { discrete: true },
  )
  const expected = parseDocument(exportDocument(original, "json"), "json")

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(original, format), format)).toEqual(
      expected,
    )
})

test("media slot owner round trips", () => {
  const original = editor()
  original.update(
    () => {
      const owner = $createMediaNode({
        kind: "image",
        url: "https://example.com/photo.png",
        alt: "Photo",
      })

      $setSlot(
        owner,
        "note",
        $createParagraphNode().append($createTextNode("Slot")),
      )
      $getRoot().append(owner)
    },
    { discrete: true },
  )
  const expected = parseDocument(exportDocument(original, "json"), "json")

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(original, format), format)).toEqual(
      expected,
    )
})

test("nested slots retain repeated names on different owners", () => {
  const original = editor()
  importDocument(original, "Host", "markdown")
  original.update(
    () => {
      const owner = $getRoot().getFirstChild()

      if (!owner || !$isElementNode(owner)) throw new Error("Missing owner.")

      const first = $createParagraphNode().append($createTextNode("First"))
      $setSlot(
        first,
        "note",
        $createParagraphNode().append($createTextNode("Nested")),
      )
      $setSlot(owner, "note", first)
    },
    { discrete: true },
  )
  const expected = parseDocument(exportDocument(original, "json"), "json")

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(original, format), format)).toEqual(
      expected,
    )
})

test("legacy direct root and nested wrappers keep their owners", () => {
  const html =
    '<p>Host</p><div data-editor-slot="note"><p>Root</p></div><blockquote><p>Quote</p><div data-editor-slot="note"><p>Nested</p></div></blockquote>'

  const parsed = parseDocument(html, "html")
  const target = editor()
  importDocument(target, html, "html")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(parsed)
  expect(parsed.root.$slots?.note).toBeDefined()
  expect(parsed.root.children[1]?.$slots?.note).toBeDefined()
})
