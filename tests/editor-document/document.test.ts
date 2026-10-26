import { createHeadlessEditor } from "@lexical/headless"
import { registerHistory, createEmptyHistoryState } from "@lexical/history"
import {
  documentNodes,
  DocumentError,
  parseDocument,
  exportDocument,
  importDocument,
  streamMarkdown,
} from "@yopem-ui/editor/document"
import { describe, expect, test } from "bun:test"
import { UNDO_COMMAND } from "lexical"

function editor() {
  return createHeadlessEditor({
    namespace: "document-test",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

for (const format of ["json", "html", "markdown"] as const) {
  test(`missing target nodes cannot commit partial ${format} input`, () => {
    const errors: Error[] = []

    const target = createHeadlessEditor({
      namespace: "missing-table-node",
      onError(error) {
        errors.push(error)
      },
    })

    importDocument(target, "<p>Original</p>", "html")
    const before = target.getEditorState()
    const source = editor()
    importDocument(
      source,
      "<p>Replacement</p><table><tr><td>Required table</td></tr></table>",
      "html",
    )

    expect(() =>
      importDocument(target, exportDocument(source, format), format),
    ).toThrow(DocumentError)
    expect(errors).toEqual([])
    expect(target.getEditorState()).toBe(before)
  })
}

test.each([
  "",
  ' title=""',
  ' title="Tooltip"',
  ' rel=""',
  ' target="_self" rel="nofollow"',
  ' target="_blank" rel="nofollow"',
])("HTML link metadata remains native JSON compatible: %s", (title) => {
  const document = parseDocument(
    `<p><a href="https://example.com"${title}>Link</a></p>`,
    "html",
  )

  expect(parseDocument(JSON.stringify(document), "json")).toEqual(document)
})

test.each(["html", "markdown"] as const)(
  "rejects opener relations in %s",
  (format) => {
    expect(() =>
      parseDocument(
        '<p><a href="https://example.com" target="_blank" rel="opener" title="Info">Link</a></p>',
        format,
      ),
    ).toThrow(DocumentError)
  },
)

test.each([
  { target: "_blank", rel: "opener" },
  { target: "_self", rel: "nofollow OPENER" },
  { target: "named-window", rel: "noopener noreferrer" },
])("rejects unsafe native link metadata: %j", (attributes) => {
  const source = JSON.stringify({
    root: {
      type: "root",
      version: 1,
      children: [
        {
          type: "paragraph",
          version: 1,
          children: [
            {
              type: "link",
              version: 1,
              url: "https://example.com",
              title: "Info",
              ...attributes,
              children: [{ type: "text", version: 1, text: "Link" }],
            },
          ],
        },
      ],
    },
  })

  expect(() => parseDocument(source, "json")).toThrow(DocumentError)
})

const rich =
  "# Report\n\n**Bold** and ~~gone~~ with [link](https://example.com).\n\n- [x] Done\n- [ ] Next\n  - Nested\n\n| Name | Value |\n| --- | --- |\n| A | B |\n\n> Quote\n\n```ts\nconst x = 1\n```\n"

describe("portable document boundary", () => {
  test("GFM round trip retains nested lists, tasks, links, strike, tables and code", () => {
    const instance = editor()
    importDocument(instance, rich, "markdown")
    const html = exportDocument(instance, "html")
    expect(html).toContain("<table>")
    expect(html).toContain("<del>")
    expect(html).toContain("https://example.com")
    expect(html).toContain("checked")
    expect(html).toContain("Nested")
    const markdown = exportDocument(instance, "markdown")
    expect(markdown).toContain("[x]")
    expect(markdown).toContain("| Name")
    const second = editor()
    importDocument(second, markdown, "markdown")
    expect(exportDocument(second, "html")).toBe(html)
  })
  test("HTML preserves cell spans, text styles, formatting and nested content", () => {
    const instance = editor()
    importDocument(
      instance,
      '<table><tr><th colspan="2">Title</th></tr><tr><td rowspan="2"><p><span style="color: #123456; font-size: 18px">Color</span></p></td><td><strong>Bold</strong></td></tr><tr><td>End</td></tr></table>',
      "html",
    )
    const html = exportDocument(instance, "html")
    expect(html).toContain('colspan="2"')
    expect(html).toContain('rowspan="2"')
    expect(html).toContain("#123456")
    expect(html).toContain("18px")
    const second = editor()
    importDocument(second, exportDocument(instance, "markdown"), "markdown")
    expect(second.getEditorState().toJSON()).toEqual(
      instance.getEditorState().toJSON(),
    )
  })
  test.each([
    "<script>alert(1)</script><p>safe</p>",
    '<p onclick="alert(1)">safe</p>',
    '<a href="jav&#x61;script:alert(1)">x</a>',
    '<a href="data:text/html,x">x</a>',
    '<p style="background-image:url(https://evil.test)">x</p>',
    '<p style="color:expression(alert(1))">x</p>',
    '<iframe src="https://evil.test"></iframe>',
    '<svg><a href="javascript:x">x</a></svg>',
    "<custom-card>preserve me</custom-card>",
    '<p data-secret="custom">x</p>',
  ])(
    "rejects unsafe or unrepresentable HTML without changing state: %s",
    (source) => {
      const instance = editor()
      importDocument(instance, "Original", "markdown")
      const before = instance.getEditorState().toJSON()
      expect(() => importDocument(instance, source, "html")).toThrow()
      expect(instance.getEditorState().toJSON()).toEqual(before)
    },
  )
  test("Markdown footnotes use their canonical optional nodes", () => {
    const document = JSON.stringify(
      parseDocument("Text[^a]\n\n[^a]: Footnote", "markdown"),
    )

    expect(document).toContain('"type":"editor-footnote-reference"')
    expect(document).toContain('"type":"editor-footnote-definition"')
  })
  test.each([
    "<script>alert(1)</script>",
    "<Widget value={run()} />",
    "![image](https://example.com/a.png)",
  ])("reports unsupported Markdown, never evaluates: %s", (source) => {
    expect(() => parseDocument(source, "markdown")).toThrow()
  })
  test("bounds input bytes, tree depth and nodes; rejects invalid JSON", () => {
    expect(() => parseDocument("x".repeat(1_048_577), "markdown")).toThrow()
    expect(() =>
      parseDocument(
        "<blockquote>".repeat(65) + "x" + "</blockquote>".repeat(65),
        "html",
      ),
    ).toThrow()
    expect(() => parseDocument("<p>x</p>".repeat(10_001), "html")).toThrow()
    expect(() => parseDocument('{"root":null}', "json")).toThrow()
    expect(() => parseDocument("{", "json")).toThrow()
  })
  test("readonly import rejected; one import is one undo step", () => {
    const instance = editor()
    const stop = registerHistory(instance, createEmptyHistoryState(), 300)
    importDocument(instance, "Original", "markdown")
    importDocument(instance, rich, "markdown")
    instance.dispatchCommand(UNDO_COMMAND, undefined)
    expect(exportDocument(instance, "markdown").trim()).toBe("Original")
    instance.setEditable(false)
    expect(() => importDocument(instance, "Changed", "markdown")).toThrow()
    stop()
  })
  test("stream publishes real accumulated output and commits once; abort preserves prior state", async () => {
    const instance = editor()
    importDocument(instance, "Original", "markdown")
    const updates: string[] = []

    async function* chunks() {
      await Promise.resolve()
      yield "# Stream\n"
      yield "\n**Done**"
    }

    await streamMarkdown(instance, chunks(), {
      onProgress(value) {
        updates.push(value)
      },
    })
    expect(updates).toEqual(["# Stream\n", "# Stream\n\n**Done**"])
    expect(exportDocument(instance, "html")).toContain("<strong>Done</strong>")
    const before = instance.getEditorState().toJSON()
    const controller = new AbortController()

    async function* interrupted() {
      await Promise.resolve()
      yield "Partial"
      controller.abort()
      yield " lost"
    }

    const failure = await streamMarkdown(instance, interrupted(), {
      signal: controller.signal,
    }).catch((error: Error) => error)

    expect(failure).toBeInstanceOf(Error)
    expect(instance.getEditorState().toJSON()).toEqual(before)
  })
  test("concurrent requests need no browser globals", async () => {
    const before = globalThis.document
    await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        Promise.resolve().then(() => {
          const instance = editor()
          importDocument(instance, `# Request ${index}`, "markdown")
          expect(exportDocument(instance, "html")).toContain(`Request ${index}`)
        }),
      ),
    )
    expect(globalThis.document).toBe(before)
  })
})
