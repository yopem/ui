import { EditorColumnsGroupNode, EditorColumnNode } from "@editor/columns-node"
import { EditorDateNode } from "@editor/date-node"
import { EditorDrawingNode } from "@editor/drawing-node"
import { EditorEditableCardNode } from "@editor/editable-card-node"
import {
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
} from "@editor/footnote-node"
import { EditorLabelNode } from "@editor/labels-node"
import { EditorTocNode } from "@editor/toc-node"
import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  DocumentError,
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
  streamMarkdown,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"

const optionalNodes = [
  EditorColumnsGroupNode,
  EditorColumnNode,
  EditorDateNode,
  EditorDrawingNode,
  EditorEditableCardNode,
  EditorFootnoteReferenceNode,
  EditorFootnoteDefinitionNode,
  EditorLabelNode,
  EditorTocNode,
] as const

function editor(
  nodes: readonly (typeof optionalNodes)[number][] = optionalNodes,
) {
  return createHeadlessEditor({
    namespace: "document-optional-nodes",
    nodes: [...documentNodes, ...nodes],
    onError(error) {
      throw error
    },
  })
}

function text(value: string) {
  return {
    type: "text",
    version: 1,
    text: value,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
  }
}

function paragraph(...children: object[]) {
  return {
    type: "paragraph",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children,
  }
}

function optionalDocument() {
  return {
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        paragraph(
          text("Before "),
          {
            type: "editor-footnote-reference",
            version: 1,
            identifier: "note-1",
          },
          text(" on "),
          { type: "editor-date", version: 1, date: "2024-02-29" },
          text(" "),
          {
            type: "editor-label",
            version: 1,
            label: "Reviewed",
            text: "Reviewed",
            format: 0,
            detail: 0,
            mode: "token",
            style: "",
          },
        ),
        {
          type: "editor-toc",
          version: 1,
        },
        {
          type: "heading",
          version: 1,
          tag: "h2",
          direction: null,
          format: "",
          indent: 0,
          children: [text("Section")],
        },
        {
          type: "editor-columns-group",
          version: 1,
          layout: [60, 40],
          direction: "rtl",
          format: "",
          indent: 0,
          children: [
            {
              type: "editor-column",
              version: 1,
              children: [paragraph(text("Left"))],
            },
            {
              type: "editor-column",
              version: 1,
              children: [paragraph(text("Right"))],
            },
          ],
        },
        {
          type: "code",
          version: 1,
          language: "mermaid",
          direction: null,
          format: "",
          indent: 0,
          $: {
            editorDiagram: {
              version: 1,
              kind: "mermaid",
              viewMode: "both",
            },
          },
          children: [text("flowchart TD\nA-->B")],
        },
        {
          type: "editor-drawing",
          version: 1,
          elements: [{ id: "shape-1", type: "rectangle", x: 10, y: 20 }],
        },
        { type: "editor-editable-card", version: 1 },
        {
          type: "editor-footnote-definition",
          version: 1,
          identifier: "note-1",
          direction: null,
          format: "",
          indent: 0,
          children: [paragraph(text("Footnote body"))],
        },
        {
          type: "editor-footnote-definition",
          version: 1,
          identifier: "note-1",
          direction: null,
          format: "",
          indent: 0,
          children: [paragraph(text("Duplicate definition"))],
        },
        paragraph({
          type: "editor-footnote-reference",
          version: 1,
          identifier: "unresolved",
        }),
        {
          type: "list",
          version: 1,
          listType: "number",
          start: 3,
          tag: "ol",
          direction: null,
          format: "",
          indent: 0,
          $: { yopemListMarker: "decimal" },
          children: [
            {
              type: "listitem",
              version: 1,
              value: 3,
              direction: null,
              format: "",
              indent: 0,
              children: [text("List item")],
            },
          ],
        },
        {
          type: "table",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          children: [
            {
              type: "tablerow",
              version: 1,
              height: 41.125,
              direction: null,
              format: "",
              indent: 0,
              children: [
                {
                  type: "tablecell",
                  version: 1,
                  colSpan: 1,
                  rowSpan: 1,
                  headerState: 0,
                  direction: null,
                  format: "",
                  indent: 0,
                  children: [paragraph(text("Cell"))],
                },
              ],
            },
          ],
        },
      ],
    },
  }
}

test("optional node JSON, canonical HTML, Markdown fallback and standalone HTML retain exact state", () => {
  const source = JSON.stringify(optionalDocument())
  const expected = parseDocument(source, "json")
  const instance = editor()

  importDocument(instance, source, "json")

  expect(parseDocument(exportDocument(instance, "json"), "json")).toEqual(
    expected,
  )

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(instance, format), format)).toEqual(
      expected,
    )

  const html = exportDocument(instance, "html")
  const parsed = parseHTML(html).document

  const targetIds = new Set(
    Array.from(parsed.querySelectorAll("[id]")).map((element) =>
      element.getAttribute("id"),
    ),
  )

  for (const link of parsed.querySelectorAll('a[href^="#"]'))
    expect(targetIds.has(link.getAttribute("href")?.slice(1) ?? "")).toBe(true)

  expect(htmlDocument(instance)).toContain("Drawing with 1 elements")
  expect(htmlDocument(instance)).not.toContain("<svg")
  expect(htmlDocument(instance)).not.toContain("<script")
})

test("optional HTML round trips retain row, list, text style, and presentation metadata", () => {
  const source = JSON.stringify(optionalDocument())
  const initial = editor()
  importDocument(initial, source, "json")
  const html = exportDocument(initial, "html")
  const second = editor()

  importDocument(second, html, "html")
  expect(second.getEditorState().toJSON()).toEqual(
    initial.getEditorState().toJSON(),
  )
  expect(html).toContain('start="3"')
  expect(html).toContain('data-editor-list-marker="decimal"')
  expect(html).toContain('data-editor-row-height="41.125"')
})

test.each([
  '<figure data-editor-drawing="1" data-editor-drawing-scene="{&quot;elements&quot;:[{&quot;id&quot;:&quot;x&quot;,&quot;type&quot;:&quot;rectangle&quot;,&quot;files&quot;:[]}]}">Drawing</figure>',
  '<figure data-editor-editable-card="1" data-editor-drawing="1">Card</figure>',
  '<div data-editor-columns="1" data-editor-columns-layout="50,49"><div data-editor-column="1"><p>A</p></div><div data-editor-column="1"><p>B</p></div></div>',
  '<time data-editor-date="1" datetime="2023-02-29">2023-02-29</time>',
  '<yopem-editor-label data-editor-label="Reviewed">Other</yopem-editor-label>',
  '<pre data-editor-diagram="1" data-editor-diagram-kind="mermaid" data-editor-diagram-view="image"><code> </code></pre>',
])(
  "rejects malformed or conflicting optional metadata before import: %s",
  (html) => {
    const target = editor()
    importDocument(target, "Keep existing", "markdown")
    const before = target.getEditorState()

    expect(() => importDocument(target, html, "html")).toThrow(DocumentError)
    expect(target.getEditorState()).toBe(before)
  },
)

test("unregistered optional nodes and readonly imports preserve current content", () => {
  const target = editor([])
  importDocument(target, "Keep existing", "markdown")
  const before = target.getEditorState()
  const source = JSON.stringify(optionalDocument())

  expect(() => importDocument(target, source, "json")).toThrow(DocumentError)
  expect(target.getEditorState()).toBe(before)

  const registered = editor()
  importDocument(registered, "Keep existing", "markdown")
  registered.setEditable(false)
  const readonlyBefore = registered.getEditorState()

  expect(() => importDocument(registered, source, "json")).toThrow(
    DocumentError,
  )
  expect(registered.getEditorState()).toBe(readonlyBefore)
})

test("optional-node streaming rejects stale concurrent edits and incomplete streams", async () => {
  const instance = editor()
  importDocument(instance, "Original", "markdown")
  const original = instance.getEditorState()
  let signalProgress: (() => void) | undefined
  let releaseStream: (() => void) | undefined

  const firstChunk = new Promise<void>((resolve) => {
    signalProgress = resolve
  })

  const waiting = new Promise<void>((resolve) => {
    releaseStream = resolve
  })

  async function* chunks() {
    yield '<figure data-editor-editable-card="1">Editable card</figure>'
    await waiting
    yield "\n"
  }

  const pending = streamMarkdown(instance, chunks(), {
    onProgress() {
      signalProgress?.()
    },
  })

  await firstChunk
  expect(instance.getEditorState()).toBe(original)
  importDocument(instance, "Concurrent edit", "markdown")
  const concurrent = instance.getEditorState()
  releaseStream?.()
  const result = await pending.catch((error: Error) => error)

  expect(result).toBeInstanceOf(DocumentError)
  expect(instance.getEditorState()).toBe(concurrent)
  expect(exportDocument(instance, "markdown")).toContain("Concurrent edit")
})
