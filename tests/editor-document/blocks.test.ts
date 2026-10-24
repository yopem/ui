import { createHeadlessEditor } from "@lexical/headless"
import {
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
} from "@yopem-ui/editor/blocks-model"
import {
  documentNodes,
  importDocument,
  exportDocument,
  parseDocument,
  DocumentError,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

const source =
  '<aside data-editor-callout="true" data-appearance="warning" data-icon="⚠"><p>Warning</p></aside><details data-editor-toggle="true" open><summary><a href="https://example.com" target="_blank" rel="noopener noreferrer">Summary</a></summary><div data-editor-toggle-body="true"><p>Body</p></div></details>'

function editor(blocks = true) {
  return createHeadlessEditor({
    namespace: "document-blocks",
    nodes: blocks
      ? documentNodes
      : documentNodes.filter(
          (node) =>
            ![CalloutNode, ToggleNode, ToggleSummaryNode, ToggleBodyNode].some(
              (block) => block === node,
            ),
        ),
    onError(error) {
      throw error
    },
  })
}

test.each(["json", "html", "markdown"] as const)(
  "native blocks roundtrip through %s",
  (format) => {
    const first = editor()
    importDocument(first, source, "html")
    const baseline = first.getEditorState().toJSON()
    const second = editor()
    importDocument(second, exportDocument(first, format), format)
    expect(second.getEditorState().toJSON()).toEqual(baseline)
    expect(baseline.root.children.map((node) => node.type)).toEqual([
      "editor-callout",
      "editor-toggle",
    ])
    expect(exportDocument(second, "html")).toContain("<summary")
    expect(exportDocument(second, "html")).toContain("data-editor-toggle-body")
  },
)

test.each([
  source.replace('data-appearance="warning"', 'data-appearance="invalid"'),
  source.replace('data-icon="⚠"', 'data-icon="&lt;script&gt;"'),
  '<details data-editor-toggle="true"><div data-editor-toggle-body="true"><p>Body</p></div><summary>Late</summary></details>',
  '<details data-editor-toggle="true"><summary><p>Block</p></summary><div data-editor-toggle-body="true"><p>Body</p></div></details>',
  '<div data-editor-toggle-body="true"><p>Orphan</p></div>',
  source.replace("https://example.com", "javascript:alert(1)"),
  source.replace("<summary>", '<summary aria-label="Toggle content">'),
])("invalid block import preserves live state", (html) => {
  const target = editor()
  importDocument(target, "Before", "markdown")
  const before = target.getEditorState().toJSON()
  expect(() => importDocument(target, html, "html")).toThrow(DocumentError)
  expect(target.getEditorState().toJSON()).toEqual(before)
})

test("target without native blocks rejects before mutation", () => {
  const target = editor(false)
  importDocument(target, "Before", "markdown")
  const before = target.getEditorState().toJSON()
  expect(() => importDocument(target, source, "html")).toThrow(DocumentError)
  expect(target.getEditorState().toJSON()).toEqual(before)
})

test("block NodeState and presentation survive portable formats", () => {
  const value = parseDocument(source, "html")
  const first = value.root.children[0]

  if (!first) throw new Error("Missing callout")

  const state = JSON.stringify(value).replace(
    '"appearance":"warning"',
    '"$":{"hostMarker":{"enabled":true},"editorBlockPresentation":{"lineHeight":"1.8","textIndent":"24px"}},"appearance":"warning"',
  )

  const target = editor()
  importDocument(target, state, "json")

  for (const format of ["json", "html", "markdown"] as const) {
    const second = editor()
    importDocument(second, exportDocument(target, format), format)
    expect(second.getEditorState().toJSON()).toEqual(
      target.getEditorState().toJSON(),
    )
  }
})
