import { DocumentTocNode } from "@editor/document/optional-nodes"
import { parseEditorTocNode, validateEditorTocJSON } from "@editor/toc-model"
import { EditorTocNode } from "@editor/toc-node"
import { createHeadlessEditor } from "@lexical/headless"
import { expect, test } from "bun:test"

const text = {
  type: "text",
  version: 1,
  text: "Retained",
  detail: 0,
  format: 1,
  mode: "normal",
  style: "",
}

const paragraph = {
  type: "paragraph",
  version: 1,
  direction: "ltr",
  format: "center",
  indent: 2,
  children: [text],
}

const toc = { type: "editor-toc", version: 1 } as const

const slotted = { ...toc, $slots: { note: paragraph } }

interface NestedNode {
  type: string
  version: number
  children: NestedNode[]
}

interface TocFixture {
  type: string
  version: number
  $slots?: Record<string, { type: string; version: number }>
}

function documentWith(node: TocFixture) {
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [node],
    },
  }
}

for (const Node of [EditorTocNode, DocumentTocNode]) {
  test(`${Node.name} retains TOC slots in native JSON`, () => {
    const editor = createHeadlessEditor({
      namespace: `toc-slot-${Node.name}`,
      nodes: [Node],
      onError(error) {
        throw error
      },
    })

    for (const value of [slotted, toc]) {
      const state = editor.parseEditorState(JSON.stringify(documentWith(value)))
      const output = state.toJSON()

      const expected =
        value === slotted
          ? {
              ...slotted,
              $slots: { note: { ...paragraph, textFormat: 1, textStyle: "" } },
            }
          : toc

      expect(output.root.children).toEqual([expected])
      expect(editor.parseEditorState(JSON.stringify(output)).toJSON()).toEqual(
        output,
      )
    }
  })
}

test("TOC slot wrappers reject invalid names and host metadata", () => {
  for (const name of [
    "",
    "bad name",
    "1name",
    "a".repeat(65),
    "__proto__",
    "constructor",
    "prototype",
  ]) {
    const $slots = Object.fromEntries([[name, paragraph]])
    expect(() => parseEditorTocNode({ ...toc, $slots })).toThrow()
  }

  for (const $slots of [
    null,
    [],
    {},
    { note: null },
    { note: [] },
    { note: {} },
  ])
    expect(() => parseEditorTocNode({ ...toc, $slots })).toThrow()

  for (const value of [
    { ...slotted, headings: [] },
    { ...slotted, $: { unknown: true } },
    { ...slotted, children: [] },
    { ...slotted, version: 2 },
  ])
    expect(() => parseEditorTocNode(value)).toThrow()

  expect(parseEditorTocNode(slotted)).toEqual(slotted)
  expect(parseEditorTocNode(toc)).toEqual(toc)
})

test("TOC readers reject unrecognized or malformed NodeState before import", () => {
  const states = [
    {},
    null,
    [],
    { custom: { nested: [1, { value: "retained" }] } },
    { editorBlockPresentation: { lineHeight: "2", textIndent: "0" } },
    { yopemTableBorder: { invalid: true } },
    { codeWrap: true },
    JSON.parse('{"__proto__":{"polluted":true}}'),
    { constructor: { polluted: true } },
  ]

  for (const state of states) {
    for (const value of [toc, slotted]) {
      const input = { ...value, $: state }
      expect(() => parseEditorTocNode(input)).toThrow("TOC NodeState")
      expect(() => validateEditorTocJSON(documentWith(input))).toThrow(
        "TOC NodeState",
      )

      for (const Node of [EditorTocNode, DocumentTocNode]) {
        const editor = createHeadlessEditor({
          namespace: `toc-state-${Node.name}`,
          nodes: [Node],
          onError(error) {
            throw error
          },
        })

        expect(() =>
          editor.parseEditorState(JSON.stringify(documentWith(input))),
        ).toThrow("TOC NodeState")
      }
    }
  }
})

test("TOC slot descendants count toward document node and depth caps", () => {
  const deep: NestedNode = { type: "quote", version: 1, children: [] }
  let current = deep

  for (let index = 0; index < 64; index++) {
    const child: NestedNode = { type: "quote", version: 1, children: [] }
    current.children.push(child)
    current = child
  }

  const wide = {
    type: "quote",
    version: 1,
    children: Array.from({ length: 10000 }, () => ({
      type: "paragraph",
      version: 1,
    })),
  }

  for (const slot of [deep, wide]) {
    expect(() =>
      validateEditorTocJSON(documentWith({ ...toc, $slots: { note: slot } })),
    ).toThrow()
    expect(() =>
      parseEditorTocNode({ ...toc, $slots: { note: slot } }),
    ).toThrow()
  }

  expect(() => validateEditorTocJSON(documentWith(slotted))).not.toThrow()
})
