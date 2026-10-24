import {
  createEditorTocHeadingId,
  parseEditorTocNode,
  validateEditorTocJSON,
} from "@editor/toc-model"
import { expect, test } from "bun:test"

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
