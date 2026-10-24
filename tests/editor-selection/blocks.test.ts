import {
  $shouldCopyToggleStructure,
  $createCalloutNode,
  $createToggleNode,
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
  validateEditorBlocksJSON,
} from "@yopem-ui/editor/blocks-model"
import { describe, expect, test } from "bun:test"
import {
  $createRangeSelection,
  $createNodeSelection,
  $setSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical"

function model() {
  return createEditor({
    namespace: "blocks-test",
    nodes: [CalloutNode, ToggleNode, ToggleSummaryNode, ToggleBodyNode],
    onError(error) {
      throw error
    },
  })
}

describe("native block model", () => {
  test("server import, nested rich children, metadata and JSON roundtrip", () => {
    expect(Reflect.has(globalThis, "document")).toBe(false)
    const editor = model()
    editor.update(
      () => {
        const callout = $createCalloutNode("warning", "⚠️")
        const toggle = $createToggleNode()
        toggle
          .getSummary()
          .append($createTextNode("Summary").toggleFormat("bold"))
        toggle
          .getBody()
          .append(
            $createParagraphNode().append($createTextNode("Body")),
            callout,
          )
        callout.append($createParagraphNode().append($createTextNode("Nested")))
        $getRoot().append(toggle)
      },
      { discrete: true },
    )
    const json = editor.getEditorState().toJSON()
    validateEditorBlocksJSON(json)
    const next = model()
    next.setEditorState(next.parseEditorState(JSON.stringify(json)))
    expect(next.getEditorState().toJSON()).toEqual(json)
    expect(
      next.getEditorState().read(() => $getRoot().getTextContent()),
    ).toContain("Nested")
  })

  test("reject unsafe icons and invalid appearance without mutation", () => {
    const editor = model()
    editor.update(
      () => {
        const callout = $createCalloutNode()
        $getRoot().append(callout.append($createParagraphNode()))
        expect(() => callout.setIcon("<img src=x>")).toThrow()
        expect(() => callout.setIcon("x".repeat(33))).toThrow()
        expect(callout.getIcon()).toBe("💡")
      },
      { discrete: true },
    )
    const json = editor.getEditorState().toJSON()
    const invalid = structuredClone(json)
    Object.assign(invalid.root.children[0], { appearance: "url(x)" })
    expect(() => validateEditorBlocksJSON(invalid)).toThrow()
    expect(editor.getEditorState().toJSON()).toEqual(json)
  })

  test("reject malformed toggle, orphan parts, excessive nesting and versions", () => {
    for (const node of [
      { type: "editor-toggle", version: 1, open: true, children: [] },
      { type: "editor-toggle-summary", version: 1, children: [] },
      {
        type: "editor-callout",
        version: 2,
        appearance: "info",
        icon: "",
        children: [],
      },
    ])
      expect(() =>
        validateEditorBlocksJSON({
          root: {
            type: "root",
            children: [{ direction: null, format: "", indent: 0, ...node }],
          },
        }),
      ).toThrow()

    interface NestedNode {
      type: string
      children: NestedNode[]
    }

    let node: NestedNode = { type: "paragraph", children: [] }

    for (let index = 0; index < 65; index++)
      node = { type: "paragraph", children: [node] }
    expect(() => validateEditorBlocksJSON({ root: node })).toThrow()
  })
})

test("full native ranges retain toggle structure while partial ranges flatten", () => {
  const editor = model()
  editor.update(
    () => {
      const toggle = $createToggleNode()
      const title = $createTextNode("Title")
      const body = $createTextNode("Body")
      toggle.getSummary().append(title)
      toggle.getBody().append($createParagraphNode().append(body))
      const host = $createCalloutNode().append(toggle)
      $getRoot().append(host)
      const selection = $createRangeSelection()
      selection.anchor.set(title.getKey(), 0, "text")
      selection.focus.set(body.getKey(), 4, "text")
      $setSelection(selection)

      for (const node of [toggle, toggle.getSummary(), toggle.getBody()]) {
        expect($shouldCopyToggleStructure(node, selection)).toBe(true)
        expect(node.extractWithChild(title, selection, "clone")).toBe(true)
      }

      expect(host.extractWithChild(toggle, selection, "clone")).toBe(true)
      selection.anchor.set(title.getKey(), 1, "text")

      for (const node of [toggle, toggle.getSummary(), toggle.getBody()])
        expect($shouldCopyToggleStructure(node, selection)).toBe(false)
      const nodes = $createNodeSelection()
      nodes.add(host.getKey())

      for (const node of [toggle, toggle.getSummary(), toggle.getBody()])
        expect($shouldCopyToggleStructure(node, nodes)).toBe(true)
    },
    { discrete: true },
  )
})
