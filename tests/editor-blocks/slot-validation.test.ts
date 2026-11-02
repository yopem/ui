import { validateEditorBlocksJSON } from "@editor/blocks-model"
import { expect, test } from "bun:test"

interface Node {
  type: string
  children?: Node[]
  $slots?: Record<string, Node>
  $?: unknown
}

function element(type: string, children: Node[] = []) {
  return { type, version: 1, direction: null, format: "", indent: 0, children }
}

function callout(children: Node[] = []) {
  return {
    ...element("editor-callout", children),
    appearance: "info",
    icon: "",
  }
}

function toggle(summary: Node[] = [], body: Node[] = []) {
  return {
    ...element("editor-toggle", [
      element("editor-toggle-summary", summary),
      element("editor-toggle-body", body),
    ]),
    open: true,
  }
}

function document(...children: Node[]) {
  return { root: { type: "root", children } }
}

test("complete blocks and metadata validate in slots without changing inputs", () => {
  const value = document({
    ...callout([element("paragraph")]),
    $: { host: { key: "value" } },
    $slots: { note: toggle([], [callout()]) },
  })

  const before = structuredClone(value)

  expect(() => validateEditorBlocksJSON(value)).not.toThrow()
  expect(value).toEqual(before)
  expect(() =>
    validateEditorBlocksJSON(document(callout(), toggle())),
  ).not.toThrow()
  expect(() =>
    validateEditorBlocksJSON(document({ ...callout(), $slots: {} })),
  ).not.toThrow()
})

test("slot boundaries do not create ordinary toggle parents or erase summary context", () => {
  for (const part of [
    element("editor-toggle-summary"),
    element("editor-toggle-body"),
  ]) {
    for (const host of [element("paragraph"), toggle(), callout()])
      expect(() =>
        validateEditorBlocksJSON(document({ ...host, $slots: { part } })),
      ).toThrow()
  }

  const summary = element("editor-toggle-summary", [
    { type: "link", $slots: { note: element("paragraph") } },
  ])

  const validSummary = element("editor-toggle-summary", [
    { type: "link", $slots: { note: { type: "text" } } },
  ])

  const body = element("editor-toggle-body")

  expect(() =>
    validateEditorBlocksJSON(
      document({ ...toggle(), children: [summary, body] }),
    ),
  ).toThrow()
  expect(() =>
    validateEditorBlocksJSON(
      document({ ...toggle(), children: [validSummary, body] }),
    ),
  ).not.toThrow()
})

test("slot nodes retain strict block schemas and reject malformed slot maps", () => {
  for (const node of [
    { ...callout(), appearance: "invalid" },
    { ...callout(), extra: true },
    { ...toggle(), children: [] },
    { ...callout(), $slots: [] },
    { ...callout(), $slots: { note: null } },
  ])
    expect(() =>
      validateEditorBlocksJSON({
        root: { type: "root", $slots: { note: node } },
      }),
    ).toThrow()
})

test("children and slots share block node and depth limits", () => {
  expect(() =>
    validateEditorBlocksJSON(
      document({
        type: "paragraph",
        $slots: {
          note: {
            type: "paragraph",
            children: Array.from({ length: 9997 }, () => ({ type: "text" })),
          },
        },
      }),
    ),
  ).not.toThrow()
  expect(() =>
    validateEditorBlocksJSON(
      document({
        type: "paragraph",
        $slots: {
          note: {
            type: "paragraph",
            children: Array.from({ length: 9998 }, () => ({ type: "text" })),
          },
        },
      }),
    ),
  ).toThrow()
  let node: Node = { type: "text" }

  for (let index = 0; index < 63; index += 1)
    node = { type: "paragraph", $slots: { note: node } }
  expect(() => validateEditorBlocksJSON(document(node))).not.toThrow()
  node = { type: "paragraph", $slots: { note: node } }
  expect(() => validateEditorBlocksJSON(document(node))).toThrow()
})
