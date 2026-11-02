import { parseReviewDocumentJSON } from "@editor/review-codecs"
import { parseTablePresentationJSON } from "@editor/table-presentation-schema"
import { createHeadlessEditor } from "@lexical/headless"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical"

const valid =
  '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"Keep"}]}],"$":{"custom":[{"name":1},{"name":2}]}}}'

const duplicates = [
  '{"root":{"type":"root","children":[]},"root":{"type":"root","children":[]}}',
  '{"root":{"type":"root","type":"root","children":[]}}',
  '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"old","text":"new"}]}]}}',
  '{"root":{"type":"root","children":[],"$":{"custom":[{"name":1,"\\u006eame":2}]}}}',
  '{"root":{"type":"root","children":[],"$":{"custom":{"x":1,"\\u0078":2},"custom":{}}}}',
  '{"root":{"type":"root","children":[],"$":{"custom":[[{"x":1,"x":2}]]}}}',
]

function parseBoth(input: string) {
  return [
    () => parseTablePresentationJSON(input),
    () => JSON.stringify(parseReviewDocumentJSON(input, true)),
    () => JSON.stringify(parseReviewDocumentJSON(input, false, true)),
  ]
}

test("raw document parsers reject duplicate decoded keys at every object level", () => {
  expect(parseTablePresentationJSON(valid)).toBe(valid)
  expect(parseReviewDocumentJSON(valid, true)).toEqual(JSON.parse(valid))
  expect(parseReviewDocumentJSON(valid, false, true)).toEqual(JSON.parse(valid))

  for (const input of duplicates) {
    const parsers = parseBoth(input)

    for (const [index, parse] of parsers.entries()) {
      expect(parse).toThrow()
      expect(parse).toThrow(
        index === 0
          ? "Table document contains duplicate keys."
          : "Review document contains duplicate keys.",
      )
    }
  }
})

test("raw document parsers preserve syntax and input bounds", () => {
  for (const input of [
    '{"root":{"type":"root","type":"root","children":[]}} trailing',
    '{"root":{"type":"root","children":[],"x":"\\q"}}',
    '{"root":{"type":"root","children":[],"\\q":0}}',
    '{"root":{"type":"root","children":[}}',
  ])
    for (const parse of parseBoth(input)) expect(parse).toThrow(SyntaxError)

  for (const input of [
    " ".repeat(1_048_577),
    JSON.stringify({
      root: { type: "root", children: [], extra: "界".repeat(350_000) },
    }),
  ])
    for (const parse of parseBoth(input)) expect(parse).toThrow()

  const prefix = '{"root":{"type":"root","children":[],"extra":"'
  const suffix = '"}}'

  const atLimit =
    prefix + "x".repeat(1_048_576 - prefix.length - suffix.length) + suffix

  expect(parseTablePresentationJSON(atLimit)).toBe(atLimit)
  expect(parseReviewDocumentJSON(atLimit, true)).toEqual(JSON.parse(atLimit))
})

test("raw scanning adds no depth restriction to otherwise valid table metadata", () => {
  const nested = "[".repeat(100) + "0" + "]".repeat(100)
  const input = `{"root":{"type":"root","children":[],"extra":${nested}}}`

  expect(parseTablePresentationJSON(input)).toBe(input)
  expect(() => parseReviewDocumentJSON(input, true, true)).toThrow(
    "Review input exceeds complexity limit.",
  )
})

test("rejected raw imports keep the headless editor document and selection", () => {
  const editor = createHeadlessEditor()
  editor.update(
    () => {
      const text = $createTextNode("Current")

      $getRoot().append($createParagraphNode().append(text))
      text.select(2, 5)
    },
    { discrete: true },
  )

  const before = JSON.stringify(editor.getEditorState().toJSON())

  const selectionBefore = editor.getEditorState().read(() => {
    const selection = $getSelection()

    if (!$isRangeSelection(selection))
      throw new Error("Missing range selection")

    return [
      selection.anchor.key,
      selection.anchor.offset,
      selection.focus.key,
      selection.focus.offset,
    ]
  })

  for (const input of duplicates) {
    for (const [index, parse] of parseBoth(input).entries()) {
      function importDocument() {
        const next = parse()
        editor.setEditorState(editor.parseEditorState(next))
      }

      expect(importDocument).toThrow()
      expect(importDocument).toThrow(
        index === 0
          ? "Table document contains duplicate keys."
          : "Review document contains duplicate keys.",
      )
      expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(before)
      expect(
        editor.getEditorState().read(() => {
          const selection = $getSelection()

          if (!$isRangeSelection(selection))
            throw new Error("Missing range selection")

          return [
            selection.anchor.key,
            selection.anchor.offset,
            selection.focus.key,
            selection.focus.offset,
          ]
        }),
      ).toEqual(selectionBefore)
    }
  }
})
