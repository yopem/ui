import { parseEditorReviewNativeFragment } from "@editor/review-fragment-native"
import { expect, test } from "bun:test"

const namespace = "native-inline-review"

function parseNodes<Node>(nodes: readonly Node[]) {
  return parseEditorReviewNativeFragment(
    JSON.stringify({ namespace, nodes }),
    namespace,
  )
}

const boldText = {
  type: "text",
  version: 1,
  detail: 0,
  format: 1,
  mode: "normal",
  style: "",
  text: "Rich paragraph",
} as const

test("native review clipboard rejects duplicate decoded keys", () => {
  const valid = JSON.stringify({ namespace, nodes: [boldText] })

  for (const source of [
    valid.replace('"namespace":', '"namespace":"other","namespace":'),
    valid.replace(
      '"text":"Rich paragraph"',
      '"text":"old","t\\u0065xt":"Rich paragraph"',
    ),
  ]) {
    expect(parseEditorReviewNativeFragment(source, namespace)).toEqual({
      status: "rejected",
      reason: "invalid-fragment",
    })
  }
})

test("native range clipboard preserves a top-level formatted text node", () => {
  expect(parseNodes([boldText])).toEqual({
    status: "validated",
    blocks: [{ type: "paragraph", version: 1, children: [boldText] }],
  })
})

test("native inline groups preserve line breaks and neighboring block order", () => {
  const linebreak = { type: "linebreak", version: 1 } as const

  const paragraph = {
    type: "paragraph" as const,
    version: 1 as const,
    children: [{ ...boldText, text: "Block", format: 0 }],
  }

  expect(parseNodes([boldText, linebreak, paragraph, boldText])).toEqual({
    status: "validated",
    blocks: [
      { type: "paragraph", version: 1, children: [boldText, linebreak] },
      paragraph,
      { type: "paragraph", version: 1, children: [boldText] },
    ],
  })
})

test("inline normalization retains strict native node validation", () => {
  for (const node of [
    { ...boldText, mode: "token" },
    { ...boldText, style: "color: red" },
    { ...boldText, format: 256 },
    { ...boldText, unexpected: true },
    { type: "link", url: "javascript:alert(1)", children: [boldText] },
  ]) {
    expect(parseNodes([node]).status).toBe("rejected")
  }

  expect(parseNodes([{ type: "linebreak", version: 1 }]).status).toBe(
    "rejected",
  )
  expect(parseNodes(Array.from({ length: 129 }, () => boldText)).status).toBe(
    "rejected",
  )
})

test("inline normalization strips untrusted review authority", () => {
  expect(
    parseNodes([
      {
        ...boldText,
        $: { yopemSuggestion: { id: "forged", authorId: "administrator" } },
      },
    ]),
  ).toEqual({
    status: "validated",
    blocks: [{ type: "paragraph", version: 1, children: [boldText] }],
  })
})
