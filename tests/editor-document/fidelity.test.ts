import { createHeadlessEditor } from "@lexical/headless"
import { registerHistory, createEmptyHistoryState } from "@lexical/history"
import {
  documentNodes,
  parseDocument,
  importDocument,
  exportDocument,
  htmlDocument,
  streamMarkdown,
  DocumentError,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $setState,
  createState,
  UNDO_COMMAND,
} from "lexical"
import { z } from "zod"

function editor() {
  return createHeadlessEditor({
    namespace: "fidelity",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

const source =
  '<blockquote><p data-editor-indent="2" data-editor-block-presentation=\'{"lineHeight":"1.8","textIndent":"24px"}\' dir="rtl"><strong><u>A</u></strong><sub>B</sub><sup>C</sup><mark>D</mark><span style="text-transform: uppercase; color: #123456">Case</span></p></blockquote><ol start="-2"><li>First<ul><li>Nested</li></ul></li></ol><table data-editor-col-widths="[120,160]" data-editor-row-striping="true" data-editor-frozen-columns="1" data-editor-frozen-rows="1"><tr><th colspan="2" data-editor-border="hidden" style="background-color: #abcdef; width: 120px"><p>Title</p></th></tr><tr><td><p>Left</p></td><td><p>Right</p></td></tr></table>'

test.each(["json", "html", "markdown"] as const)(
  "rich semantic roundtrip through %s",
  (format) => {
    const first = editor()
    importDocument(first, source, "html")
    const baseline = first.getEditorState().toJSON()
    const serialized = exportDocument(first, format)
    const second = editor()
    importDocument(second, serialized, format)
    expect(second.getEditorState().toJSON()).toEqual(baseline)
    expect(JSON.stringify(baseline)).toContain("editorBlockPresentation")
    expect(JSON.stringify(baseline)).toContain("yopemTableBorder")
    expect(exportDocument(second, "html")).toContain(
      "text-transform: uppercase",
    )
  },
)

test("JSON preserves known NodeState and rejects malformed or unsafe state with diagnostics", () => {
  const valid = parseDocument(source, "html")
  const json = JSON.stringify(valid)

  for (const replacement of ['"__proto__":', '"constructor":']) {
    expect(() =>
      parseDocument(
        json.replace('"editorBlockPresentation":', replacement),
        "json",
      ),
    ).toThrow(DocumentError)
  }

  expect(() =>
    parseDocument(json.replace('"1.8"', '"url(javascript:x)"'), "json"),
  ).toThrow(DocumentError)
  expect(() =>
    parseDocument(json.replace('"hidden"', '"dashed"'), "json"),
  ).toThrow(DocumentError)
  expect(parseDocument(json, "json")).toEqual(valid)
})

test.each([0, -1, -1000])("ordered lists preserve native start %s", (start) => {
  const first = editor()
  importDocument(first, `<ol start="${start}"><li>Item</li></ol>`, "html")

  for (const format of ["html", "markdown", "json"] as const) {
    const second = editor()
    importDocument(second, exportDocument(first, format), format)
    expect(second.getEditorState().toJSON()).toEqual(
      first.getEditorState().toJSON(),
    )
  }
})

test.each([
  "<p><script>alert(1)</script></p>",
  '<p><img src=x onerror="alert(1)"></p>',
  '<span style="text-transform: url(https://evil.test)">X</span>',
  '<p data-editor-indent="999">X</p>',
  '<p data-editor-block-presentation=\'{"lineHeight":"1.5","textIndent":"2px","secret":1}\'>X</p>',
  '<td data-editor-border="dashed">X</td>',
  '<table data-editor-col-widths="[1000000]"><tr><td>X</td></tr></table>',
  '<table><tr><td rowspan="1000000" colspan="1000000">X</td></tr></table>',
  '<a href="javascript:alert(1)">X</a>',
  "<Widget value={run()} />",
])("raw HTML Markdown fails closed: %s", (html) => {
  const instance = editor()
  importDocument(instance, "Before", "markdown")
  const before = instance.getEditorState().toJSON()
  expect(() => importDocument(instance, html, "markdown")).toThrow(
    DocumentError,
  )
  expect(instance.getEditorState().toJSON()).toEqual(before)
})

test("table budgets reject small JSON with huge spans before Lexical layout", () => {
  const valid = JSON.stringify(parseDocument(source, "html"))

  for (const field of ["colSpan", "rowSpan"]) {
    expect(() =>
      parseDocument(
        valid.replace(new RegExp(`"${field}":\\d+`), `"${field}":1000000`),
        "json",
      ),
    ).toThrow(DocumentError)
  }

  expect(() =>
    parseDocument(
      "<table><tr>" +
        '<td colspan="50" rowspan="50">X</td>'.repeat(2) +
        "</tr></table>",
      "html",
    ),
  ).toThrow(DocumentError)
})

test("mixed Markdown and raw HTML retain rich content without DOM globals", async () => {
  const before = globalThis.document
  await Promise.all(
    Array.from({ length: 8 }, async (_, index) => {
      const instance = editor()
      importDocument(
        instance,
        `# Request ${index}\n\n**bold** <u>under</u> and <span style="text-transform: lowercase">CASE</span>\n\n${source}`,
        "markdown",
      )
      const second = editor()
      importDocument(second, exportDocument(instance, "markdown"), "markdown")
      expect(second.getEditorState().toJSON()).toEqual(
        instance.getEditorState().toJSON(),
      )
      await Promise.resolve()
    }),
  )
  expect(globalThis.document).toBe(before)
})

test("rich stream commits one undo step, cancellation and concurrent edits preserve document", async () => {
  const instance = editor()
  const stop = registerHistory(instance, createEmptyHistoryState(), 300)
  importDocument(instance, "Before", "markdown")

  async function* chunks() {
    await Promise.resolve()
    yield source.slice(0, 70)
    yield source.slice(70)
  }

  await streamMarkdown(instance, chunks())
  instance.dispatchCommand(UNDO_COMMAND, undefined)
  expect(exportDocument(instance, "markdown").trim()).toBe("Before")
  const controller = new AbortController()

  async function* cancelled() {
    await Promise.resolve()
    yield "<u>Partial"
    controller.abort()
    yield "</u>"
  }

  const cancelledResult = await streamMarkdown(instance, cancelled(), {
    signal: controller.signal,
  }).catch((error: Error) => error)

  expect(cancelledResult).toBeInstanceOf(DocumentError)
  expect(exportDocument(instance, "markdown").trim()).toBe("Before")

  async function* changed() {
    await Promise.resolve()
    yield source
    importDocument(instance, "User edit", "markdown")
  }

  const changedResult = await streamMarkdown(instance, changed()).catch(
    (error: Error) => error,
  )

  expect(changedResult).toBeInstanceOf(DocumentError)
  expect(exportDocument(instance, "markdown").trim()).toBe("User edit")
  stop()
})

test("headless standalone uses explicit local fonts and default surface", () => {
  const instance = editor()
  importDocument(instance, "Text\n\n```ts\nx\n```", "markdown")
  const html = htmlDocument(instance)
  expect(html).toContain("Inter")
  expect(html).toContain("IBM Plex Mono")
  expect(html).toContain("color: #000; background-color: #fff")
  expect(html).not.toContain("Arial")
})

test.each(["lowercase", "uppercase", "capitalize"])(
  "text case %s and safe block CSS survive HTML and Markdown",
  (casing) => {
    const first = editor()
    importDocument(
      first,
      `<p style="line-height: 2; text-indent: 24px; text-align: center"><span style="text-transform: ${casing}; font-family: Inter; font-size: 18px"><u><strong><em><del>Mixed</del></em></strong></u></span></p>`,
      "html",
    )
    expect(JSON.stringify(first.getEditorState().toJSON())).toContain(
      "editorBlockPresentation",
    )

    for (const format of ["html", "markdown", "json"] as const) {
      const second = editor()
      importDocument(second, exportDocument(first, format), format)
      expect(second.getEditorState().toJSON()).toEqual(
        first.getEditorState().toJSON(),
      )
    }
  },
)

test("JSON table header flags, row height and border state survive conversion", () => {
  const first = editor()

  const json = JSON.stringify(parseDocument(source, "html"))
    .replace('"headerState":1', '"headerState":3')
    .replace('"type":"tablerow"', '"height":48,"type":"tablerow"')

  importDocument(first, json, "json")

  for (const format of ["html", "markdown"] as const) {
    const second = editor()
    importDocument(second, exportDocument(first, format), format)
    expect(second.getEditorState().toJSON()).toEqual(
      first.getEditorState().toJSON(),
    )
  }
})

test("root table budget applies across tables and unsupported inline state requires JSON", () => {
  const table = '<table><tr><td colspan="50" rowspan="50">X</td></tr></table>'
  expect(() => parseDocument(table + table, "html")).toThrow(DocumentError)
  const instance = editor()

  const value = JSON.stringify(parseDocument("Text", "markdown")).replace(
    '"type":"text"',
    '"$":{"unknown":true},"type":"text"',
  )

  instance.setEditorState(instance.parseEditorState(value))

  expect(parseDocument(exportDocument(instance, "json"), "json")).toEqual(
    instance.getEditorState().toJSON(),
  )

  for (const format of ["html", "markdown"] as const)
    expect(() => exportDocument(instance, format)).toThrow(DocumentError)
})

test("native table colgroup widths import without losing layout", () => {
  const instance = editor()
  importDocument(
    instance,
    '<table><colgroup><col style="width: 120px"><col style="width: 160px"></colgroup><tbody><tr><td>A</td><td>B</td></tr></tbody></table>',
    "html",
  )
  expect(JSON.stringify(instance.getEditorState().toJSON())).toContain(
    '"colWidths":[120,160]',
  )
  const second = editor()
  importDocument(second, exportDocument(instance, "markdown"), "markdown")
  expect(second.getEditorState().toJSON()).toEqual(
    instance.getEditorState().toJSON(),
  )
})

test.each(["160px", "10em", "2.5rem"])(
  "current block helper bounds roundtrip %s",
  (indent) => {
    const first = editor()
    importDocument(
      first,
      `<p data-editor-block-presentation='{"lineHeight":"4","textIndent":"${indent}"}'>Current</p>`,
      "html",
    )
    const second = editor()
    importDocument(second, exportDocument(first, "markdown"), "markdown")
    expect(second.getEditorState().toJSON()).toEqual(
      first.getEditorState().toJSON(),
    )
    expect(() =>
      parseDocument(
        `<p data-editor-block-presentation='{"lineHeight":"4","textIndent":"161px"}'>Invalid</p>`,
        "html",
      ),
    ).toThrow(DocumentError)
  },
)

test("native Lexical table metadata survives semantic export", () => {
  const instance = editor()
  importDocument(
    instance,
    '<table data-lexical-row-striping="true" data-lexical-frozen-column="true" data-lexical-frozen-row="true"><tr><td>X</td></tr></table>',
    "html",
  )
  const serialized = JSON.stringify(instance.getEditorState().toJSON())
  expect(serialized).toContain('"rowStriping":true')
  expect(serialized).toContain('"frozenColumnCount":1')
  expect(serialized).toContain('"frozenRowCount":1')
  const second = editor()
  importDocument(second, exportDocument(instance, "markdown"), "markdown")
  expect(second.getEditorState().toJSON()).toEqual(
    instance.getEditorState().toJSON(),
  )
})

test.each([47, 641])(
  "table cell user width %s fails at document boundary",
  (width) => {
    expect(() =>
      parseDocument(
        `<table><tr><td style="width: ${width}px">X</td></tr></table>`,
        "html",
      ),
    ).toThrow(DocumentError)

    const json = JSON.stringify(parseDocument(source, "html")).replace(
      '"width":120',
      `"width":${width}`,
    )

    expect(() => parseDocument(json, "json")).toThrow(DocumentError)
  },
)

test("combined code and emphasis retain every inline format", () => {
  const first = editor()
  importDocument(
    first,
    "<p><code><strong><em>Code</em></strong></code></p>",
    "html",
  )
  const second = editor()
  importDocument(second, exportDocument(first, "markdown"), "markdown")
  expect(second.getEditorState().toJSON()).toEqual(
    first.getEditorState().toJSON(),
  )
})

for (const format of ["html", "markdown"] as const) {
  test.each([" ", "\t", "\n", "\f", " x ", "a  b", "a\tb", "a\nb"])(
    `${format} retains native text whitespace: %j`,
    (value) => {
      const first = editor()
      first.update(
        () => {
          $getRoot()
            .clear()
            .append($createParagraphNode().append($createTextNode(value)))
        },
        { discrete: true },
      )
      const second = editor()
      importDocument(second, exportDocument(first, format), format)
      expect(second.read(() => $getRoot().getTextContent())).toBe(value)
    },
  )
}

test.each([
  "\0",
  "\ud800",
  "\r",
  "a\rb",
  "\u000b",
  "\ufdd0",
  "\u007f",
  "\u{1fffe}",
])("native JSON-only text rejects lossy exports: %j", (value) => {
  const first = editor()
  first.update(
    () => {
      $getRoot()
        .clear()
        .append($createParagraphNode().append($createTextNode(value)))
    },
    { discrete: true },
  )
  const second = editor()
  importDocument(second, exportDocument(first, "json"), "json")
  expect(second.read(() => $getRoot().getTextContent())).toBe(value)
  expect(() => exportDocument(first, "html")).toThrow(DocumentError)
  expect(() => exportDocument(first, "markdown")).toThrow(DocumentError)
  expect(() => htmlDocument(first)).toThrow(DocumentError)
})

const foreignTextState = createState("foreignText", {
  parse(value) {
    return z.string().catch("").parse(value)
  },
})

test.each(["\0", "\ud800", "\r", "\u000b", "\ufdd0", "\u007f", "\u{1fffe}"])(
  "metadata retains JSON-encoded text characters: %j",
  (value) => {
    const first = editor()
    first.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode("Metadata"),
        )

        $setState(paragraph, foreignTextState, value)
        $getRoot().clear().append(paragraph)
      },
      { discrete: true },
    )

    for (const format of ["json", "html", "markdown"] as const) {
      const second = editor()
      importDocument(second, exportDocument(first, format), format)
      expect(second.getEditorState().toJSON()).toEqual(
        first.getEditorState().toJSON(),
      )
    }
  },
)

test.each(["\0", "\ud800"])("invalid Markdown text fails: %j", (value) => {
  expect(() => parseDocument(value, "markdown")).toThrow(DocumentError)
})

test("Markdown keeps formatting on boundary whitespace", () => {
  const first = editor()
  first.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append(
            $createTextNode("Before "),
            $createTextNode(" bold ").toggleFormat("bold"),
            $createTextNode("after"),
          ),
        )
    },
    { discrete: true },
  )
  const second = editor()
  importDocument(second, exportDocument(first, "markdown"), "markdown")
  expect(second.getEditorState().toJSON()).toEqual(
    first.getEditorState().toJSON(),
  )
})

test("Markdown source line endings follow parser semantics", () => {
  const target = editor()
  importDocument(target, "first\r\nsecond", "markdown")
  expect(target.read(() => $getRoot().getTextContent())).toBe("first\nsecond")
})

test("plain preformatted code keeps Markdown fences and whitespace", () => {
  const first = editor()
  importDocument(first, "```js\none\ttwo\nthree\n```", "markdown")
  const output = exportDocument(first, "markdown")
  expect(output).toMatch(/^(?:`{3,}|~{3,})/m)
  const second = editor()
  importDocument(second, output, "markdown")
  expect(second.getEditorState().toJSON()).toEqual(
    first.getEditorState().toJSON(),
  )
})

test("later blocks retain boundary whitespace", () => {
  const first = editor()
  first.update(
    () => {
      $getRoot()
        .clear()
        .append(
          $createParagraphNode().append($createTextNode("First")),
          $createParagraphNode().append($createTextNode(" second ")),
        )
    },
    { discrete: true },
  )
  const second = editor()
  importDocument(second, exportDocument(first, "markdown"), "markdown")
  expect(second.getEditorState().toJSON()).toEqual(
    first.getEditorState().toJSON(),
  )
})
