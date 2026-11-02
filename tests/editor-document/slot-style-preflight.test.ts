import { editorBlockPresentationState } from "@editor/block-presentation"
import { $createMediaNode } from "@editor/media/model"
import { createHeadlessEditor } from "@lexical/headless"
import { $createQuoteNode } from "@lexical/rich-text"
import {
  documentNodes,
  downloadDocument,
  exportDocument,
  htmlDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setSlot,
  $setState,
} from "lexical"
import { parseHTML } from "linkedom"

const formats = ["json", "html", "markdown"] as const

function editor() {
  return createHeadlessEditor({
    namespace: "slot-style-preflight",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

for (const host of ["root", "element", "decorator"] as const) {
  for (const location of ["slot", "child", "nested-slot"] as const) {
    test(`rejects unpersisted style in ${location} of ${host} host`, () => {
      const instance = editor()
      instance.update(
        () => {
          const root = $getRoot()

          const paragraph = $createParagraphNode().append(
            $createTextNode("Host"),
          )

          const media = $createMediaNode({
            kind: "image",
            url: "https://example.com/photo.png",
            alt: "Photo",
          })

          root.append(paragraph, media)

          const owner =
            host === "root" ? root : host === "element" ? paragraph : media

          const slot = $createParagraphNode().append($createTextNode("Slot"))

          const styled = $createParagraphNode()
            .append($createTextNode("Styled"))
            .setStyle("color: red")

          if (location === "slot") slot.setStyle("color: red")

          if (location === "child") {
            const quote = $createQuoteNode().append(styled)
            $setSlot(owner, "note", quote)
          } else {
            $setSlot(owner, "note", slot)

            if (location === "nested-slot") $setSlot(slot, "nested", styled)
          }
        },
        { discrete: true },
      )
      const state = instance.getEditorState()
      const before = state.toJSON()

      for (const format of formats)
        expect(() => exportDocument(instance, format)).toThrow(
          "Unpersisted native element style cannot be exported.",
        )
      expect(() => htmlDocument(instance)).toThrow(
        "Unpersisted native element style cannot be exported.",
      )
      expect(instance.getEditorState()).toBe(state)
      expect(instance.getEditorState().toJSON()).toEqual(before)
    })
  }
}

test("preserves persisted block and text styles in slots and all output formats", () => {
  const instance = editor()
  instance.update(
    () => {
      const host = $createQuoteNode().append(
        $createParagraphNode().append($createTextNode("Host")),
      )

      const slot = $createParagraphNode().append(
        $createTextNode("Styled").setStyle("color: red"),
      )

      $setState(slot, editorBlockPresentationState, {
        lineHeight: "2",
        textIndent: "12px",
      })
      $setSlot(host, "note", slot)
      $getRoot().append(host)
    },
    { discrete: true },
  )
  const expected = instance.getEditorState().toJSON()

  for (const format of formats)
    expect(parseDocument(exportDocument(instance, format), format)).toEqual(
      expected,
    )
  const standalone = htmlDocument(instance)
  expect(standalone).toContain("line-height: 2")
  expect(standalone).toContain("text-indent: 12px")
  expect(standalone).toContain("color: red")
  expect(instance.getEditorState().toJSON()).toEqual(expected)
})

test("rejects nonempty root native style before HTML exports and download", () => {
  const instance = editor()
  instance.update(
    () => {
      $getRoot()
        .append($createParagraphNode().append($createTextNode("Content")))
        .setStyle("color: red")
    },
    { discrete: true },
  )
  const state = instance.getEditorState()
  const before = state.toJSON()

  const ownerDocument = parseHTML(
    "<!doctype html><html><body></body></html>",
  ).document

  for (const action of [
    () => exportDocument(instance, "html"),
    () => htmlDocument(instance),
    () => downloadDocument(instance, "html", ownerDocument),
  ])
    expect(action).toThrow(
      "Unpersisted native element style cannot be exported.",
    )
  expect(instance.getEditorState()).toBe(state)
  expect(instance.getEditorState().toJSON()).toEqual(before)
  instance.read(() => expect($getRoot().getStyle()).toBe("color: red"))
})

test("deep slot trees reject before export", () => {
  const instance = editor()
  instance.update(
    () => {
      const root = $getRoot()
      root.append($createParagraphNode().append($createTextNode("Host")))
      let host = $createParagraphNode()
      $setSlot(root, "slot", host)

      for (let index = 0; index < 65; index += 1) {
        const next = $createParagraphNode()
        $setSlot(host, "slot", next)
        host = next
      }
    },
    { discrete: true },
  )
  expect(() => exportDocument(instance, "json")).toThrow()
  expect(() => htmlDocument(instance)).toThrow(
    "Document exceeds editor block limits.",
  )
})

test("ordinary child native styles reject without changing editor state", () => {
  const instance = editor()
  instance.update(
    () => {
      $getRoot().append(
        $createParagraphNode()
          .append($createTextNode("Text"))
          .setStyle("color: red"),
      )
    },
    { discrete: true },
  )
  const before = instance.getEditorState()

  for (const format of formats)
    expect(() => exportDocument(instance, format)).toThrow(
      "Unpersisted native element style cannot be exported.",
    )
  expect(instance.getEditorState()).toBe(before)
})
