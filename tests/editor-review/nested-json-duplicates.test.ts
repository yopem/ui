import {
  parseReviewDocument,
  parseReviewDocumentJSON,
  sanitizeEditorReviewClipboard,
} from "@editor/review-codecs"
import { createHeadlessEditor } from "@lexical/headless"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical"

const author = { id: "alice", name: "Alice" }

const suggestion = {
  id: "fragment-1",
  author,
  createdAt: 1,
  kind: "insert",
  beforeFormat: 0,
}

const before = JSON.stringify({
  root: { type: "root", children: [{ type: "paragraph", children: [] }] },
})

const after = JSON.stringify({
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            text: "inserted",
            $: { yopemSuggestion: suggestion },
          },
        ],
      },
    ],
  },
})

function fragmentDocument(beforeSnapshot: string, afterSnapshot: string) {
  return {
    root: {
      type: "root",
      children: [{ type: "paragraph", children: [] }],
      $: {
        custom: { retained: true },
        yopemReviewNativeFragment: {
          version: 1,
          id: suggestion.id,
          author,
          createdAt: suggestion.createdAt,
          before: beforeSnapshot,
          after: afterSnapshot,
        },
      },
    },
  }
}

test("trusted native fragment snapshots reject nested escaped-equivalent keys", () => {
  const valid = fragmentDocument(before, after)
  expect(parseReviewDocumentJSON(JSON.stringify(valid), true)).toEqual(valid)

  for (const position of ["before", "after"] as const) {
    const snapshot = position === "before" ? before : after

    const duplicate = snapshot.replace(
      '"type":"paragraph"',
      '"type":"old","\\u0074ype":"paragraph"',
    )

    expect(duplicate).not.toBe(snapshot)

    const input = fragmentDocument(
      position === "before" ? duplicate : before,
      position === "after" ? duplicate : after,
    )

    const original = JSON.stringify(input)
    expect(parseReviewDocument(JSON.parse(original), false)).toEqual({
      root: {
        type: "root",
        children: [{ type: "paragraph", children: [] }],
        $: { custom: { retained: true } },
      },
    })
    expect(() => parseReviewDocument(input, true)).toThrow(
      "Review document contains duplicate keys.",
    )
    expect(JSON.stringify(input)).toBe(original)
    expect(() => parseReviewDocumentJSON(original, true)).toThrow(
      "Review document contains duplicate keys.",
    )
    expect(parseReviewDocumentJSON(original, false)).toEqual({
      root: {
        type: "root",
        children: [{ type: "paragraph", children: [] }],
        $: { custom: { retained: true } },
      },
    })
  }
})

test("snapshot scanning retains validation precedence and unrelated metadata", () => {
  const validBefore = before.replace(
    '"type":"paragraph"',
    '"type":"old","\\u0074ype":"paragraph"',
  )

  const input = fragmentDocument(validBefore, after)

  const lastWins = fragmentDocument(
    JSON.stringify(JSON.parse(validBefore)),
    after,
  )

  expect(parseReviewDocument(lastWins, true)).toEqual(lastWins)
  const malformed = fragmentDocument('{"root":', after)
  expect(() => parseReviewDocument(malformed, true)).toThrow(SyntaxError)
  const missingAttribution = fragmentDocument(validBefore, before)
  expect(() => parseReviewDocument(missingAttribution, true)).toThrow(
    "Native review fragment has no inserted text attribution.",
  )
  expect(() => parseReviewDocument(input, true)).toThrow(
    "Review document contains duplicate keys.",
  )
})

test("public clipboard sanitizer rejects escaped duplicates after existing validation", () => {
  const raw =
    '{"namespace":"editor","nodes":[{"type":"paragraph","children":[{"type":"text","text":"old","\\u0074ext":"new"}]}]}'

  const normalized = JSON.stringify(JSON.parse(raw))
  expect(sanitizeEditorReviewClipboard(normalized)).toEqual({
    namespace: "editor",
    nodes: [{ type: "paragraph", children: [{ type: "text", text: "new" }] }],
  })
  expect(() => sanitizeEditorReviewClipboard(raw)).toThrow(
    "Review document contains duplicate keys.",
  )

  const strippedMetadata =
    '{"namespace":"editor","nodes":[{"type":"text","text":"safe","$":{"yopemSuggestion":{"id":"old","\\u0069d":"new"}}}]}'

  expect(
    sanitizeEditorReviewClipboard(JSON.stringify(JSON.parse(strippedMetadata))),
  ).toEqual({ namespace: "editor", nodes: [{ type: "text", text: "safe" }] })
  expect(() => sanitizeEditorReviewClipboard(strippedMetadata)).toThrow(
    "Review document contains duplicate keys.",
  )
  expect(() =>
    sanitizeEditorReviewClipboard(
      '{"namespace":"editor","nodes":[],"nodes":[]}',
    ),
  ).toThrow()
  expect(() =>
    sanitizeEditorReviewClipboard('{"namespace":"editor","nodes":[}'),
  ).toThrow(SyntaxError)
  expect(() =>
    sanitizeEditorReviewClipboard(
      '{"namespace":"editor","nodes":[{"type":"text","text":"x","$":{"custom":true}}]}',
    ),
  ).toThrow()
})

test("rejected snapshots do not replace the headless document or selection", () => {
  const editor = createHeadlessEditor()
  editor.update(
    () => {
      const text = $createTextNode("Keep")
      $getRoot().append($createParagraphNode().append(text))
      text.select(1, 3)
    },
    { discrete: true },
  )
  const document = JSON.stringify(editor.getEditorState().toJSON())

  function selection() {
    return editor.getEditorState().read(() => {
      const value = $getSelection()

      if (!$isRangeSelection(value)) throw new Error("Missing range selection")

      return [
        value.anchor.key,
        value.anchor.offset,
        value.focus.key,
        value.focus.offset,
      ]
    })
  }

  const initialSelection = selection()

  for (const position of ["before", "after"] as const) {
    const snapshot = position === "before" ? before : after

    const duplicate = snapshot.replace(
      '"type":"paragraph"',
      '"type":"old","\\u0074ype":"paragraph"',
    )

    const raw = JSON.stringify(
      fragmentDocument(
        position === "before" ? duplicate : before,
        position === "after" ? duplicate : after,
      ),
    )

    expect(() => {
      const parsed = parseReviewDocumentJSON(raw, true)
      editor.setEditorState(editor.parseEditorState(JSON.stringify(parsed)))
    }).toThrow("Review document contains duplicate keys.")
    expect(JSON.stringify(editor.getEditorState().toJSON())).toBe(document)
    expect(selection()).toEqual(initialSelection)
  }
})
