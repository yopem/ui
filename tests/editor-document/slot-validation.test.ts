import { EditorColumnsGroupNode, EditorColumnNode } from "@editor/columns-node"
import { EditorTocNode } from "@editor/toc-node"
import { $insertDataTransferForRichText } from "@lexical/clipboard"
import { buildEditorFromExtensions } from "@lexical/extension"
import { createHeadlessEditor, HeadlessExtension } from "@lexical/headless"
import { registerRichText } from "@lexical/rich-text"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import {
  documentNodes,
  EditorDocumentClipboardExtension,
  exportDocument,
  importDocument,
  parseDocument,
  registerDocumentPaste,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  defineExtension,
  PASTE_TAG,
} from "lexical"

function editor() {
  return createHeadlessEditor({
    namespace: "document-slot-validation",
    nodes: [
      ...documentNodes,
      EditorTocNode,
      EditorColumnsGroupNode,
      EditorColumnNode,
    ],
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

function block(type: string, children: object[]) {
  return { type, version: 1, direction: null, format: "", indent: 0, children }
}

function documentWithSlots() {
  return JSON.stringify({
    root: {
      ...block("root", [
        {
          ...block("quote", [block("paragraph", [text("Host")])]),
          $slots: { nested: block("paragraph", [text("Nested slot")]) },
        },
        { ...block("heading", [text("Section")]), tag: "h2" },
      ]),
      $slots: { contents: { type: "editor-toc", version: 1 } },
    },
  })
}

function rejectWithoutReplacement(
  source: string,
  format: "json" | "html" | "markdown",
) {
  const target = editor()
  importDocument(target, "Keep existing", "markdown")
  const before = target.getEditorState()
  const saved = exportDocument(target, "json")
  const bytes = Buffer.from(source)
  expect(() => parseDocument(source, format)).toThrow()
  expect(() => importDocument(target, source, format)).toThrow()
  expect(target.getEditorState()).toBe(before)
  expect(exportDocument(target, "json")).toBe(saved)
  expect(Buffer.from(source)).toEqual(bytes)
}

test("root and nested slots survive JSON, HTML and Markdown round trips", () => {
  const original = editor()
  importDocument(original, documentWithSlots(), "json")
  const expected = parseDocument(exportDocument(original, "json"), "json")

  for (const format of ["html", "markdown"] as const) {
    const output = exportDocument(original, format)
    expect(output).toContain('data-editor-slot="contents"')
    expect(output).toContain('data-editor-slot="nested"')
    expect(parseDocument(output, format)).toEqual(expected)
    const target = editor()
    importDocument(target, output, format)
    expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
      expected,
    )
  }
})

test("slot wrappers accept whitespace around exactly one block", () => {
  const compact = '<p>Host</p><div data-editor-slot="note"><p>Slot</p></div>'

  const spaced =
    '<p>Host</p><div data-editor-slot="note"> \n <p>Slot</p> \t </div>'

  expect(parseDocument(spaced, "html")).toEqual(parseDocument(compact, "html"))
})

test("invalid slot wrappers and duplicate names never replace a document", () => {
  const wrapper = (contents: string, name = "note") =>
    `<div data-editor-slot="${name}">${contents}</div>`

  const slot = wrapper("<p>Slot</p>")

  const invalid = [
    wrapper(""),
    wrapper("<p>One</p><p>Two</p>"),
    wrapper("text<p>Slot</p>"),
    wrapper("<p>Slot</p><!-- extra -->"),
    wrapper("<span>inline</span>"),
    wrapper('<p onclick="alert(1)">Slot</p>'),
    wrapper('<p><a href="javascript:alert(1)">Unsafe</a></p>'),
    wrapper("<p>Slot</p>", "__proto__"),
    wrapper("<p>Slot</p>", "bad name"),
    '<section data-editor-slot="note"><p>Slot</p></section>',
    '<div data-editor-slot="note" onclick="alert(1)"><p>Slot</p></div>',
    `<p>Host</p>${slot}${slot}`,
    `<blockquote><p>Host</p>${slot}${slot}</blockquote>`,
    `<p><a href="https://example.com">Link${slot}</a></p>`,
  ]

  for (const source of invalid) rejectWithoutReplacement(source, "html")

  const recovered = editor()
  importDocument(recovered, `<p>First<p>Second</p>${slot}`, "html")
  expect(
    recovered.getEditorState().read(() => $getRoot().getTextContent()),
  ).toBe("SlotFirst\n\nSecond")

  for (const source of [
    `<p><a href="https://example.com">Link${slot}</a></p>`,
    `<P><A HREF='https://example.com'>Link<DIV DATA-EDITOR-SLOT='note'><P>Slot</P></DIV></A></P>`,
  ]) {
    for (const format of ["html", "markdown"] as const) {
      const target = editor()
      importDocument(target, "Keep selected content", "markdown")
      target.update(
        () => {
          const node = $getRoot().getFirstDescendant()

          if (!$isTextNode(node)) throw new Error("Missing text.")
          node.select(5, 13)
        },
        { discrete: true },
      )
      const before = target.getEditorState()

      const selection = before.read(() => {
        const selected = $getSelection()

        if (!$isRangeSelection(selected)) throw new Error("Missing selection.")

        return {
          anchor: [
            selected.anchor.key,
            selected.anchor.offset,
            selected.anchor.type,
          ],
          focus: [
            selected.focus.key,
            selected.focus.offset,
            selected.focus.type,
          ],
          backward: selected.isBackward(),
          text: selected.getTextContent(),
        }
      })

      const originalText = before.read(() => $getRoot().getTextContent())
      const originalSource = Buffer.from(source)
      expect(() => parseDocument(source, format)).toThrow()
      expect(() => importDocument(target, source, format)).toThrow()
      expect(target.getEditorState()).toBe(before)
      expect(
        target.getEditorState().read(() => $getRoot().getTextContent()),
      ).toBe(originalText)
      expect(
        target.getEditorState().read(() => {
          const selected = $getSelection()

          if (!$isRangeSelection(selected))
            throw new Error("Missing selection.")

          return {
            anchor: [
              selected.anchor.key,
              selected.anchor.offset,
              selected.anchor.type,
            ],
            focus: [
              selected.focus.key,
              selected.focus.offset,
              selected.focus.type,
            ],
            backward: selected.isBackward(),
            text: selected.getTextContent(),
          }
        }),
      ).toEqual(selection)
      expect(Buffer.from(source)).toEqual(originalSource)
    }
  }
})

test("HTML parser recovery and attribute aliases cannot relocate or hide slot input", () => {
  const slot = '<div data-editor-slot="note"><p>Slot</p></div>'

  const table = (inside: string) =>
    `<table>${inside}<tr><td>Host</td></tr></table>`

  const sources = [
    table(slot),
    table(`<tbody>${slot}</tbody>`),
    table(`<tbody><tr>${slot}</tr></tbody>`),
    `<table>${slot}`,
    `<blockquote><p>Host</p>${table(slot)}</blockquote>`,
    `<p><b><i>Before${slot}After</i></b></p>`,
    '<nav data-editor-toc="" arialabel="Table of contents"><ol></ol></nav>',
    '<nav data-editor-toc="" aria-label="forged" arialabel="Table of contents"><ol></ol></nav>',
    '<nav data-editor-toc="" arialabel="Table of contents" aria-label="forged"><ol></ol></nav>',
    '<nav data-editor-toc="" aria-label="Table of contents" arialabel="Table of contents"><ol></ol></nav>',
    '<nav data-editor-toc="" aria-label="Table of contents" ARIA-LABEL="Table of contents"><ol></ol></nav>',
  ]

  for (const source of sources) {
    for (const format of ["html", "markdown"] as const) {
      const target = editor()
      importDocument(target, "Keep selected content", "markdown")
      target.update(
        () => {
          const node = $getRoot().getFirstDescendant()

          if (!$isTextNode(node)) throw new Error("Missing text.")
          node.select(13, 5)
        },
        { discrete: true },
      )
      const before = target.getEditorState()
      const serialized = exportDocument(target, "json")
      const original = Buffer.from(source)

      const snapshot = () =>
        target.getEditorState().read(() => {
          const selection = $getSelection()

          if (!$isRangeSelection(selection))
            throw new Error("Missing selection.")

          return {
            text: $getRoot().getTextContent(),
            anchor: [
              selection.anchor.key,
              selection.anchor.offset,
              selection.anchor.type,
            ],
            focus: [
              selection.focus.key,
              selection.focus.offset,
              selection.focus.type,
            ],
            backward: selection.isBackward(),
            selected: selection.getTextContent(),
          }
        })

      const selection = snapshot()
      expect(() => parseDocument(source, format)).toThrow()
      expect(() => importDocument(target, source, format)).toThrow()
      expect(target.getEditorState()).toBe(before)
      expect(exportDocument(target, "json")).toBe(serialized)
      expect(snapshot()).toEqual(selection)
      expect(Buffer.from(source)).toEqual(original)
    }
  }
})

test("HTML clipboard rejects relocated slots and attribute aliases without fallback", () => {
  withDOM((window) => {
    const target = buildEditorFromExtensions(
      defineExtension({
        name: "document-slot-html-clipboard",
        nodes: documentNodes,
        dependencies: [HeadlessExtension, EditorDocumentClipboardExtension],
        onError(error) {
          throw error
        },
      }),
    )

    const richText = registerRichText(target)
    const errors: string[] = []

    const unregister = registerDocumentPaste(target, (error) =>
      errors.push(error.message),
    )

    try {
      target.update(
        () => {
          const node = $createTextNode("Keep selected content")
          $getRoot().append($createParagraphNode().append(node))
          node.select(13, 5)
        },
        { discrete: true },
      )
      const before = target.getEditorState().toJSON()

      const snapshot = () =>
        target.getEditorState().read(() => {
          const selection = $getSelection()

          if (!$isRangeSelection(selection))
            throw new Error("Missing selection.")

          return {
            text: $getRoot().getTextContent(),
            anchor: [
              selection.anchor.key,
              selection.anchor.offset,
              selection.anchor.type,
            ],
            focus: [
              selection.focus.key,
              selection.focus.offset,
              selection.focus.type,
            ],
            backward: selection.isBackward(),
            selected: selection.getTextContent(),
          }
        })

      const selection = snapshot()

      for (const source of [
        '<table><div data-editor-slot="note"><p>Slot</p></div><tr><td>Host</td></tr></table>',
        '<nav data-editor-toc="" aria-label="forged" arialabel="Table of contents"><ol></ol></nav>',
      ]) {
        const data = new window.DataTransfer()
        data.setData("text/html", source)
        data.setData("text/plain", "Fallback must not replace selection")
        target.update(
          () => {
            const current = $getSelection()

            if (!$isRangeSelection(current))
              throw new Error("Missing selection.")
            $insertDataTransferForRichText(data, current)
          },
          { discrete: true, tag: PASTE_TAG },
        )
        expect(data.getData("text/html")).toBe(source)
        expect(target.getEditorState().toJSON()).toEqual(before)
        expect(snapshot()).toEqual(selection)
      }

      expect(errors).toHaveLength(2)
    } finally {
      unregister()
      richText()
      target.dispose()
    }
  })
})

test("canonical slots and table recovery retain their input semantics", () => {
  const sources = [
    '<p>Host</p><div data-editor-slot="note"><p>Slot</p></div>',
    '<blockquote><p>Host</p><div data-editor-slot="note"><blockquote><p>Outer</p><div data-editor-slot="detail"><p>Inner</p></div></blockquote></div></blockquote>',
    '<table><tr><td><p>Cell</p></td></tr></table><div data-editor-slot="note"><p>Slot</p></div>',
    '<table><tr><td><blockquote><p>Cell</p><div data-editor-slot="note"><p>Slot</p></div></blockquote></td></tr></table>',
    '<p>First<p>Second</p><div data-editor-slot="note"><p>Slot</p></div>',
    '<nav data-editor-toc="" aria-label="Table of contents"><ol></ol></nav>',
    '<p>&lt;div data-editor-slot="note"&gt;literal&lt;/div&gt;</p>',
    '<pre><code>&lt;div data-editor-slot="note"&gt;literal&lt;/div&gt;</code></pre>',
  ]

  for (const source of sources) {
    const original = Buffer.from(source)
    const target = editor()
    const parsed = parseDocument(source, "html")
    importDocument(target, source, "html")
    expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
      parsed,
    )
    expect(Buffer.from(source)).toEqual(original)
  }
})

test("unsupported JSON slot fields and nonretained empty slots remain rejected", () => {
  const root = block("root", [block("paragraph", [text("Host")])])

  for (const input of [
    { root: { ...root, $slots: {} } },
    {
      root: { ...root, $slots: { note: { type: "unsupported", version: 1 } } },
    },
    {
      root: {
        ...root,
        $slots: { contents: { type: "editor-toc", version: 1, extra: true } },
      },
    },
    {
      root: {
        ...root,
        children: [
          { ...text("Inline"), $slots: { note: block("paragraph", []) } },
        ],
      },
    },
  ])
    rejectWithoutReplacement(JSON.stringify(input), "json")
})

test("nested ordinary slot content is retained in columns and callouts", () => {
  const nested = {
    ...block("quote", [block("paragraph", [text("Host")])]),
    $slots: {
      note: {
        ...block("quote", [block("paragraph", [text("Slot")])]),
        $slots: { detail: block("paragraph", [text("Nested")]) },
      },
    },
  }

  function column(child: ReturnType<typeof block>) {
    return block("editor-column", [child])
  }

  const source = JSON.stringify({
    root: block("root", [
      {
        ...block("editor-columns-group", [
          column(nested),
          column(block("paragraph", [text("Other")])),
        ]),
        layout: [50, 50],
      },
      {
        ...block("editor-callout", [nested]),
        appearance: "info",
        icon: "",
      },
    ]),
  })

  const target = editor()

  importDocument(target, source, "json")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
    parseDocument(source, "json"),
  )
})

test("distinct hosts and nested slots retain independent names", () => {
  const inner = '<div data-editor-slot="note"><p>Inner</p></div>'

  const html = `<blockquote><p>First</p><div data-editor-slot="note"><blockquote><p>Outer</p>${inner}</blockquote></div><div data-editor-slot="other"><p>Other</p></div></blockquote><blockquote><p>Second</p><div data-editor-slot="note"><p>Separate</p></div></blockquote>`
  const parsed = parseDocument(html, "html")
  const target = editor()

  importDocument(target, html, "html")
  expect(parseDocument(exportDocument(target, "html"), "html")).toEqual(parsed)
  rejectWithoutReplacement(
    html.replace(
      "<p>Inner</p>",
      '<p><a href="javascript:alert(1)">Inner</a></p>',
    ),
    "html",
  )
})

test("slot JSON retains reordered fields, slot names, and metadata", () => {
  const root = block("root", [block("paragraph", [text("Host")])])

  const source = JSON.stringify({
    root: {
      ...root,
      $slots: {
        second: { ...block("paragraph", [text("Second")]) },
        first: {
          children: [text("First")],
          $: { custom: { second: 2, first: 1 } },
          indent: 0,
          format: "",
          direction: null,
          version: 1,
          type: "paragraph",
        },
      },
    },
  })

  const parsed = parseDocument(source, "json")
  const slots = parsed.root.$slots

  expect(slots?.first).toMatchObject({
    type: "paragraph",
    $: { custom: { first: 1, second: 2 } },
    children: [text("First")],
  })
  expect(slots?.second).toMatchObject({ children: [text("Second")] })
  const target = editor()
  importDocument(target, source, "json")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(parsed)
})

test("slotted native elements retain supplied fields and accept omitted defaults", () => {
  const source = JSON.stringify({
    root: {
      ...block("root", [block("paragraph", [text("Host")])]),
      $slots: {
        note: {
          version: 1,
          children: [text("Slot")],
          type: "paragraph",
          $: { custom: { nested: ["a", { count: 2 }] } },
        },
      },
    },
  })

  const parsed = parseDocument(source, "json")

  expect(parsed.root.$slots?.note).toMatchObject({
    type: "paragraph",
    children: [text("Slot")],
    direction: null,
    format: "",
    indent: 0,
    $: { custom: { nested: ["a", { count: 2 }] } },
  })
  const target = editor()
  importDocument(target, source, "json")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(parsed)
})

test("JSON slot names use the portable HTML grammar", () => {
  const root = block("root", [block("paragraph", [text("Host")])])
  const slot = block("paragraph", [text("Slot")])

  for (const name of [
    "",
    "bad/name",
    "bad name",
    "1name",
    "a".repeat(65),
    "__proto__",
    "constructor",
    "prototype",
  ]) {
    const slots = Object.fromEntries([[name, slot]])
    rejectWithoutReplacement(
      JSON.stringify({ root: { ...root, $slots: slots } }),
      "json",
    )
    rejectWithoutReplacement(
      JSON.stringify({
        root: { ...root, children: [{ ...root.children[0], $slots: slots }] },
      }),
      "json",
    )
  }

  for (const name of ["a", "a-b_C", `a${"b".repeat(63)}`]) {
    const source = JSON.stringify({
      root: { ...root, $slots: { [name]: slot } },
    })

    expect(parseDocument(source, "json").root.$slots?.[name]).toBeDefined()
  }
})

test("complete structures survive in root and nested slots", () => {
  const paragraph = block("paragraph", [text("Content")])
  const column = block("editor-column", [paragraph])

  const group = {
    ...block("editor-columns-group", [column, column]),
    layout: [50, 50],
  }

  const callout = {
    ...block("editor-callout", [paragraph]),
    appearance: "info",
    icon: "",
  }

  const toggle = {
    ...block("editor-toggle", [
      block("editor-toggle-summary", [text("Title")]),
      block("editor-toggle-body", [paragraph]),
    ]),
    open: true,
  }

  for (const value of [group, callout, toggle]) {
    for (const root of [
      { ...block("root", [paragraph]), $slots: { note: value } },
      block("root", [
        { ...block("quote", [paragraph]), $slots: { note: value } },
      ]),
    ]) {
      const source = JSON.stringify({ root })
      const parsed = parseDocument(source, "json")
      const target = editor()
      importDocument(target, source, "json")
      expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
        parsed,
      )
    }
  }
})

test("nested slot structures retain callouts, toggles, columns, and tables", () => {
  const table = parseDocument("| Name |\n| --- |\n| Value |", "markdown").root
    .children[0]

  if (table?.type !== "table") throw new Error("Missing table.")

  const paragraph = block("paragraph", [text("Content")])

  const columns = {
    ...block("editor-columns-group", [
      block("editor-column", [
        { ...block("quote", [paragraph]), $slots: { table } },
      ]),
      block("editor-column", [paragraph]),
    ]),
    layout: [50, 50],
  }

  const callout = {
    ...block("editor-callout", [paragraph]),
    appearance: "info",
    icon: "",
    $slots: { columns },
  }

  const toggle = {
    ...block("editor-toggle", [
      block("editor-toggle-summary", [text("Title")]),
      { ...block("editor-toggle-body", [paragraph]), $slots: { callout } },
    ]),
    open: true,
  }

  const source = JSON.stringify({
    root: { ...block("root", [paragraph]), $slots: { toggle } },
  })

  const target = editor()
  importDocument(target, source, "json")

  const expected = parseDocument(exportDocument(target, "json"), "json")

  for (const format of ["html", "markdown"] as const)
    expect(parseDocument(exportDocument(target, format), format)).toEqual(
      expected,
    )
})

test("slots cannot hide unsupported block and column placement", () => {
  const paragraph = block("paragraph", [text("Content")])
  const column = block("editor-column", [paragraph])

  const group = {
    ...block("editor-columns-group", [column, column]),
    layout: [50, 50],
  }

  const callout = {
    ...block("editor-callout", [paragraph]),
    appearance: "info",
    icon: "",
  }

  const body = block("editor-toggle-body", [paragraph])
  const summary = block("editor-toggle-summary", [text("Title")])
  const toggle = { ...block("editor-toggle", [summary, body]), open: true }

  for (const hidden of [column, body, summary]) {
    for (const host of [
      block("root", [paragraph]),
      block("root", [{ ...block("quote", [paragraph]) }]),
      block("root", [callout]),
      block("root", [group]),
      block("root", [{ ...callout, children: [block("quote", [paragraph])] }]),
    ]) {
      const slotHost = host.children[0]

      if (!slotHost) throw new Error("Missing slot host.")

      const source = JSON.stringify({
        root: {
          ...host,
          children: [{ ...slotHost, $slots: { note: hidden } }],
        },
      })

      rejectWithoutReplacement(source, "json")
    }

    rejectWithoutReplacement(
      JSON.stringify({
        root: { ...block("root", [paragraph]), $slots: { note: hidden } },
      }),
      "json",
    )

    const slottedQuote = {
      ...block("quote", [paragraph]),
      $slots: { note: hidden },
    }

    const nestedGroup = {
      ...group,
      children: [block("editor-column", [slottedQuote]), column],
    }

    for (const container of [
      { ...callout, children: [slottedQuote] },
      nestedGroup,
      { ...toggle, children: [summary, { ...body, children: [slottedQuote] }] },
    ])
      rejectWithoutReplacement(
        JSON.stringify({ root: block("root", [container]) }),
        "json",
      )
  }
})

test("nested column groups hidden in slots reject without replacement", () => {
  const paragraph = block("paragraph", [text("Content")])

  const inner = {
    ...block("editor-columns-group", [
      block("editor-column", [paragraph]),
      block("editor-column", [paragraph]),
    ]),
    layout: [50, 50],
  }

  const outer = {
    ...block("editor-columns-group", [
      block("editor-column", [
        { ...block("quote", [paragraph]), $slots: { nested: inner } },
      ]),
      block("editor-column", [paragraph]),
    ]),
    layout: [50, 50],
  }

  rejectWithoutReplacement(
    JSON.stringify({ root: block("root", [outer]) }),
    "json",
  )
})

test("nodes registered only in a slot remain required by the target editor", () => {
  const target = createHeadlessEditor({
    namespace: "document-slot-missing-node",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  importDocument(target, "Keep existing", "markdown")
  const before = target.getEditorState()
  const source = documentWithSlots()
  expect(parseDocument(source, "json").root.$slots?.contents).toBeDefined()
  expect(() => importDocument(target, source, "json")).toThrow(
    "Unsupported target node: editor-toc.",
  )
  expect(target.getEditorState()).toBe(before)
})

test("column nodes inside slots require target registration", () => {
  const paragraph = block("paragraph", [text("Content")])

  const columns = {
    ...block("editor-columns-group", [
      block("editor-column", [paragraph]),
      block("editor-column", [paragraph]),
    ]),
    layout: [50, 50],
  }

  const source = JSON.stringify({
    root: { ...block("root", [paragraph]), $slots: { columns } },
  })

  const target = createHeadlessEditor({
    namespace: "document-slot-missing-columns",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  importDocument(target, "Keep existing", "markdown")
  const before = target.getEditorState()
  expect(parseDocument(source, "json").root.$slots?.columns).toBeDefined()
  expect(() => importDocument(target, source, "json")).toThrow(
    "Unsupported target node: editor-columns-group.",
  )
  expect(target.getEditorState()).toBe(before)
})

test("HTML slot wrappers cannot hide orphan columns or toggle parts", () => {
  for (const node of [
    '<div data-editor-column="1"><p>Orphan</p></div>',
    '<details data-editor-toggle-body=""><summary data-editor-toggle-control="" contenteditable="false" aria-label="Toggle content"></summary><div data-editor-toggle-content=""><p>Orphan</p></div></details>',
  ]) {
    rejectWithoutReplacement(
      `<p>Host</p><div data-editor-slot="note">${node}</div>`,
      "html",
    )
    rejectWithoutReplacement(
      `<blockquote><p>Host</p><div data-editor-slot="note">${node}</div></blockquote>`,
      "html",
    )
  }
})

test("deeply nested slots reject before document replacement", () => {
  let value = block("paragraph", [text("Slot")])

  for (let depth = 0; depth < 65; depth += 1)
    value = Object.assign(block("quote", []), { $slots: { nested: value } })

  rejectWithoutReplacement(
    JSON.stringify({
      root: {
        ...block("root", [block("paragraph", [text("Host")])]),
        $slots: { note: value },
      },
    }),
    "json",
  )
})

test("slot descendants count toward block and column node budgets", () => {
  const many = block(
    "paragraph",
    Array.from({ length: 10000 }, () => ({ type: "linebreak", version: 1 })),
  )

  const root = block("root", [block("paragraph", [text("Host")])])

  rejectWithoutReplacement(
    JSON.stringify({ root: { ...root, $slots: { note: many } } }),
    "json",
  )
})

test("legacy unslotted callout, toggle, and columns remain supported", () => {
  const html =
    '<aside data-editor-callout="" data-appearance="info" data-icon=""><p>Callout</p></aside><details data-editor-toggle=""><summary>Title</summary><div data-editor-toggle-body=""><p>Body</p></div></details><div data-editor-columns="1" data-editor-columns-layout="50,50"><div data-editor-column="1"><p>Left</p></div><div data-editor-column="1"><p>Right</p></div></div>'

  const parsed = parseDocument(html, "html")

  expect(parsed.root.children.map((node) => node.type)).toEqual([
    "editor-callout",
    "editor-toggle",
    "editor-columns-group",
  ])
})

test("slotted tables retain their cells through native JSON", () => {
  const table = parseDocument("| Name |\n| --- |\n| Value |", "markdown").root
    .children[0]

  if (table?.type !== "table") throw new Error("Missing table.")

  const paragraph = block("paragraph", [text("Host")])

  const source = JSON.stringify({
    root: {
      ...block("root", [paragraph]),
      $slots: {
        outer: {
          ...block("quote", [paragraph]),
          $slots: { inner: table },
        },
      },
    },
  })

  const expected = parseDocument(source, "json")
  const target = editor()

  importDocument(target, source, "json")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
    expected,
  )
})

test("a slot cannot hide a nested table or an orphan table part", () => {
  const paragraph = block("paragraph", [text("Host")])

  const table = parseDocument("| Name |\n| --- |\n| Value |", "markdown").root
    .children[0]

  if (table?.type !== "table") throw new Error("Missing table.")

  for (const hidden of [
    block("tablerow", []),
    { type: "tablecell", version: 1, children: [] },
  ])
    rejectWithoutReplacement(
      JSON.stringify({
        root: { ...block("root", [paragraph]), $slots: { hidden } },
      }),
      "json",
    )

  const outer = {
    ...block("table", [
      block("tablerow", [
        {
          ...block("tablecell", [
            { ...block("quote", [paragraph]), $slots: { nested: table } },
          ]),
          headerState: 0,
          colSpan: 1,
          rowSpan: 1,
        },
      ]),
    ]),
  }

  rejectWithoutReplacement(
    JSON.stringify({ root: block("root", [outer]) }),
    "json",
  )
})

test("duplicate JSON slot names reject before document replacement", () => {
  const paragraph = JSON.stringify(block("paragraph", [text("Slot")]))

  const root = JSON.stringify(
    block("root", [block("paragraph", [text("Host")])]),
  )

  const source = `{"root":${root.slice(0, -1)},"$slots":{"note":${paragraph},"note":${paragraph}}}}`

  rejectWithoutReplacement(source, "json")
})

test("toggle body slots survive portable HTML round trips", () => {
  const paragraph = block("paragraph", [text("Body")])

  const toggle = {
    ...block("editor-toggle", [
      block("editor-toggle-summary", [text("Title")]),
      {
        ...block("editor-toggle-body", [paragraph]),
        $slots: { note: block("paragraph", [text("Slot")]) },
      },
    ]),
    open: true,
  }

  const source = JSON.stringify({ root: block("root", [toggle]) })
  const target = editor()

  importDocument(target, source, "json")
  const expected = parseDocument(exportDocument(target, "json"), "json")
  const html = exportDocument(target, "html")

  expect(parseDocument(html, "html")).toEqual(expected)
  const markdown = exportDocument(target, "markdown")
  expect(parseDocument(markdown, "markdown")).toEqual(expected)
})

test("TOC hosts retain slotted content through JSON and portable formats", () => {
  const source = JSON.stringify({
    root: block("root", [
      { ...block("heading", [text("Section")]), tag: "h2" },
      {
        type: "editor-toc",
        version: 1,
        $slots: { note: block("paragraph", [text("TOC slot")]) },
      },
    ]),
  })

  const target = editor()
  importDocument(target, source, "json")
  const expected = parseDocument(exportDocument(target, "json"), "json")

  for (const format of ["html", "markdown"] as const) {
    const output = exportDocument(target, format)

    expect(parseDocument(output, format)).toEqual(expected)
  }
})

test("TOC NodeState rejects before replacing a document", () => {
  const states = [
    {},
    null,
    [],
    { custom: { nested: [1, { value: "retained" }] } },
    { codeWrap: true },
    { editorBlockPresentation: { lineHeight: "2", textIndent: "0" } },
    JSON.parse('{"__proto__":{"polluted":true}}'),
    { constructor: { polluted: true } },
  ]

  const paragraph = block("paragraph", [text("TOC slot")])
  const heading = { ...block("heading", [text("Section")]), tag: "h2" }

  for (const state of states) {
    for (const slots of [undefined, { note: paragraph }]) {
      const toc = { type: "editor-toc", version: 1, $: state, $slots: slots }

      for (const root of [
        block("root", [heading, toc]),
        { ...block("root", [heading]), $slots: { contents: toc } },
      ])
        rejectWithoutReplacement(JSON.stringify({ root }), "json")
    }
  }
})

test("escaped duplicate slot names reject without replacement", () => {
  const paragraph = JSON.stringify(block("paragraph", [text("Slot")]))

  const root = JSON.stringify(
    block("root", [block("paragraph", [text("Host")])]),
  )

  const source = `{"root":${root.slice(0, -1)},"$slots":{"note":${paragraph},"n\\u006fte":${paragraph}}}}`

  rejectWithoutReplacement(source, "json")
})

test("read-only target keeps its document when a slotted document is imported", () => {
  const target = editor()
  importDocument(target, "Keep existing", "markdown")
  target.setEditable(false)
  const before = target.getEditorState()
  const saved = exportDocument(target, "json")
  expect(() => importDocument(target, documentWithSlots(), "json")).toThrow()
  expect(target.getEditorState()).toBe(before)
  expect(exportDocument(target, "json")).toBe(saved)
})

test("root slot TOC requires the complete heading sequence", () => {
  const instance = editor()
  importDocument(instance, documentWithSlots(), "json")
  const html = exportDocument(instance, "html")
  expect(html).toContain('data-editor-slot="contents"')
  expect(html).toContain('<a href="#yopem-toc-document-heading-1">Section</a>')
  const incomplete = html.replace(/<ol>[\s\S]*?<\/ol>/, "<ol></ol>")
  expect(incomplete).not.toBe(html)
  rejectWithoutReplacement(incomplete, "html")
  rejectWithoutReplacement(incomplete, "markdown")
})
