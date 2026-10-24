import { serializeEditorFootnoteMarkdown } from "@editor/footnote-model"
import { expect, test } from "bun:test"

test("footnote Markdown serialization rejects oversized caller text before serialization", () => {
  expect(() =>
    serializeEditorFootnoteMarkdown({
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "x".repeat(1_048_577) }],
        },
      ],
    }),
  ).toThrow()
})

test("footnote Markdown serialization bounds UTF-8 text across nodes", () => {
  expect(() =>
    serializeEditorFootnoteMarkdown({
      type: "root",
      children: Array.from({ length: 3 }, () => ({
        type: "paragraph" as const,
        children: [{ type: "text" as const, value: "💡".repeat(100_000) }],
      })),
    }),
  ).toThrow()
})

test("footnote Markdown serialization preserves bounded native references", () => {
  const markdown = serializeEditorFootnoteMarkdown({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", value: "Text " },
          { type: "footnoteReference", identifier: "1" },
        ],
      },
      {
        type: "footnoteDefinition",
        identifier: "1",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Footnote body" }],
          },
        ],
      },
    ],
  })

  expect(markdown).toContain("[^1]")
  expect(markdown).toContain("Footnote body")
})
