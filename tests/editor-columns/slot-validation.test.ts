import { validateEditorColumnsJSON } from "@editor/columns-model"
import { expect, test } from "bun:test"

interface Node {
  type: string
  children?: Node[]
  $slots?: Record<string, Node>
  $?: unknown
}

function column(children: Node[] = [{ type: "paragraph", children: [] }]) {
  return { type: "editor-column", version: 1, children }
}

function group(children = [column(), column()]) {
  return {
    type: "editor-columns-group",
    version: 1,
    layout: [50, 50],
    children,
  }
}

function document(...children: Node[]) {
  return { root: { type: "root", children } }
}

test("complete column groups and host metadata survive slot validation", () => {
  const value = document({
    type: "paragraph",
    children: [],
    $slots: {
      note: { ...group(), $: { host: { enabled: true } }, $slots: {} },
    },
  })

  const before = structuredClone(value)

  expect(() => validateEditorColumnsJSON(value)).not.toThrow()
  expect(value).toEqual(before)
  expect(() => validateEditorColumnsJSON(document(group()))).not.toThrow()
  expect(() =>
    validateEditorColumnsJSON(document({ type: "paragraph", $slots: {} })),
  ).not.toThrow()
})

test("column context survives slot edges but slots cannot supply group children", () => {
  for (const host of [{ type: "paragraph" }, group(), column()])
    expect(() =>
      validateEditorColumnsJSON(
        document({ ...host, $slots: { orphan: column() } }),
      ),
    ).toThrow()

  const nested = group([
    column([{ type: "paragraph", $slots: { note: group() } }]),
    column(),
  ])

  expect(() => validateEditorColumnsJSON(document(nested))).toThrow()
  expect(() =>
    validateEditorColumnsJSON(
      document({ ...group(), $slots: { note: group() } }),
    ),
  ).toThrow()
  expect(() =>
    validateEditorColumnsJSON(
      document({
        ...group(),
        children: [column()],
        $slots: { other: column() },
      }),
    ),
  ).toThrow()
})

test("invalid groups, malformed slot maps and values reject", () => {
  for (const node of [
    { ...group(), layout: [49, 50] },
    { ...group(), version: 2 },
    { ...group(), children: [column(), { type: "paragraph" }] },
    { type: "paragraph", $slots: [] },
    { type: "paragraph", $slots: { note: null } },
  ])
    expect(() =>
      validateEditorColumnsJSON({
        root: { type: "root", $slots: { note: node } },
      }),
    ).toThrow()
})

test("children and slots share column node and depth limits", () => {
  expect(() =>
    validateEditorColumnsJSON(
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
    validateEditorColumnsJSON(
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
  expect(() => validateEditorColumnsJSON(document(node))).not.toThrow()
  node = { type: "paragraph", $slots: { note: node } }
  expect(() => validateEditorColumnsJSON(document(node))).toThrow()
})
