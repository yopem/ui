import {
  createEditorTocHeadingId,
  parseEditorTocNode,
  validateEditorTocJSON,
} from "@editor/toc-model"
import { EditorTocNode } from "@editor/toc-node"
import { createHeadlessEditor } from "@lexical/headless"
import { expect, test } from "bun:test"
import { $applyNodeReplacement, $createParagraphNode, $getRoot } from "lexical"

test("TOC target IDs remain bounded, valid, and unique per editor scope", () => {
  const first = createEditorTocHeadingId("editor-a", "12")
  const second = createEditorTocHeadingId("editor-b", "12")

  expect(first).not.toBe(second)
  expect(createEditorTocHeadingId("editor-a", "13")).not.toBe(first)
  expect(first.length).toBeLessThanOrEqual(128)
  expect(first).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/)
  expect(() => createEditorTocHeadingId("x".repeat(129), "1")).toThrow()
  expect(() => createEditorTocHeadingId("editor-a", "x".repeat(129))).toThrow()
})

test("TOC nodes store no copied heading list", () => {
  const node = { type: "editor-toc" as const, version: 1 as const }

  expect(parseEditorTocNode(node)).toEqual(node)
  expect(() =>
    parseEditorTocNode({
      ...node,
      headings: [{ id: "fake", title: "Not a document heading" }],
    }),
  ).toThrow()
})

test("native TOC insertion keeps the navigation node at the root", () => {
  const editor = createHeadlessEditor({
    namespace: "toc-root-contract",
    nodes: [EditorTocNode],
    onError(cause) {
      throw cause
    },
  })

  editor.update(
    () => {
      const root = $getRoot()
      const paragraph = $createParagraphNode()
      root.clear().append(paragraph)
      const selection = paragraph.selectStart()
      const toc = $applyNodeReplacement(new EditorTocNode())

      expect(toc.isInline()).toBe(false)
      selection.insertNodes([toc])
      expect(toc.getParent()?.is(root)).toBe(true)
    },
    { discrete: true },
  )
})

test("TOC document validation rejects malformed or nested feature nodes", () => {
  expect(() =>
    validateEditorTocJSON({
      root: {
        type: "root",
        children: [{ type: "editor-toc", version: 1 }],
      },
    }),
  ).not.toThrow()
  expect(() =>
    validateEditorTocJSON({
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "editor-toc", version: 1 }],
          },
        ],
      },
    }),
  ).toThrow()
})
