import { parseHTMLSyntax } from "@editor/document/boundary"
import {
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
} from "@editor/footnote-node"
import { EditorTocNode } from "@editor/toc-node"
import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  exportDocument,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { renderEditorMath } from "@yopem-ui/editor/math-render"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"

type RootContent = ReturnType<typeof parseHTMLSyntax>["children"][number]

type Element = Extract<RootContent, { type: "element" }>

function editor() {
  return createHeadlessEditor({
    namespace: "document-toc-portable",
    nodes: [
      ...documentNodes,
      EditorTocNode,
      EditorFootnoteReferenceNode,
      EditorFootnoteDefinitionNode,
    ],
    onError(error) {
      throw error
    },
  })
}

function source(count: number, withHeadings = true) {
  const toc = { type: "editor-toc", version: 1 }

  const heading = (value: string) => ({
    type: "heading",
    version: 1,
    tag: "h2",
    direction: null,
    format: "",
    indent: 0,
    children: [
      {
        type: "text",
        version: 1,
        text: value,
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
      },
    ],
  })

  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        toc,
        ...(withHeadings
          ? [
              heading("First section"),
              {
                type: "quote",
                version: 1,
                direction: null,
                format: "",
                indent: 0,
                children: [heading("Nested section")],
              },
            ]
          : []),
        ...Array.from({ length: count - 1 }, () => toc),
      ],
    },
  })
}

function exportedHTML(count = 2) {
  const instance = editor()
  importDocument(instance, source(count), "json")

  return exportDocument(instance, "html")
}

for (const count of [1, 2, 3]) {
  test(`portable ${count} TOC document exports and imports HTML and Markdown`, () => {
    const original = editor()
    importDocument(original, source(count), "json")
    const expected = parseDocument(exportDocument(original, "json"), "json")

    for (const format of ["html", "markdown"] as const) {
      const output = exportDocument(original, format)
      expect(parseDocument(output, format)).toEqual(expected)
      const target = editor()
      importDocument(target, output, format)
      expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
        expected,
      )
    }

    const document = parseHTML(exportDocument(original, "html")).document
    const navs = Array.from(document.querySelectorAll("nav[data-editor-toc]"))
    expect(navs.map((nav) => nav.getAttribute("aria-label"))).toEqual(
      count === 1
        ? ["Table of contents"]
        : Array.from(
            { length: count },
            (_, index) => `Table of contents ${index + 1}`,
          ),
    )

    for (const nav of navs) {
      const links = Array.from(nav.querySelectorAll("a"))
      expect(links.map((link) => link.textContent)).toEqual([
        "First section",
        "Nested section",
      ])

      for (const link of links) {
        const href = link.getAttribute("href") ?? ""
        expect(document.querySelectorAll(href)).toHaveLength(1)
        expect(document.querySelector(href)?.textContent).toBe(link.textContent)
      }
    }
  })
}

test("legacy absent and unnumbered labels remain valid, including mixed labels", () => {
  const html = exportedHTML()

  const legacy = html
    .replace(' aria-label="Table of contents 1"', "")
    .replace(
      'aria-label="Table of contents 2"',
      'aria-label="Table of contents"',
    )

  const mixed = html.replace(
    'aria-label="Table of contents 1"',
    'aria-label="Table of contents"',
  )

  const expected = parseDocument(html, "html")
  expect(parseDocument(legacy, "html")).toEqual(expected)
  expect(parseDocument(mixed, "html")).toEqual(expected)
  expect(
    parseDocument(
      exportedHTML(1).replace(' aria-label="Table of contents"', ""),
      "html",
    ),
  ).toEqual(parseDocument(exportedHTML(1), "html"))
})

test("empty TOCs remain valid when the document has no headings", () => {
  for (const count of [1, 2]) {
    const original = editor()
    importDocument(original, source(count, false), "json")
    const expected = parseDocument(exportDocument(original, "json"), "json")

    for (const format of ["html", "markdown"] as const) {
      const output = exportDocument(original, format)
      expect(parseDocument(output, format)).toEqual(expected)
      const target = editor()
      importDocument(target, output, format)
      expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
        expected,
      )
    }

    const html = exportDocument(original, "html")

    const navs = parseHTML(html).document.querySelectorAll(
      "nav[data-editor-toc]",
    )

    expect(navs).toHaveLength(count)

    for (const nav of navs) expect(nav.querySelectorAll("a")).toHaveLength(0)

    const legacy = html
      .replace(/ aria-label="Table of contents(?: \d+)?"/, "")
      .replace(
        /aria-label="Table of contents \d+"/,
        'aria-label="Table of contents"',
      )

    expect(parseDocument(legacy, "html")).toEqual(expected)
  }
})

test("each TOC must contain the complete heading sequence", () => {
  for (const [count, emptyIndexes] of [
    [1, [0]],
    [2, [0]],
    [2, [1]],
    [2, [0, 1]],
    [3, [1]],
  ] as const) {
    const html = exportedHTML(count)
    let index = 0

    const incomplete = html.replace(/<ol>[\s\S]*?<\/ol>/g, (list) => {
      const current = index++

      return emptyIndexes.some((emptyIndex) => emptyIndex === current)
        ? "<ol></ol>"
        : list
    })

    expect(index).toBe(count)
    expect(incomplete).not.toBe(html)

    for (const input of [
      incomplete,
      incomplete.replace(/ aria-label="Table of contents(?: \d+)?"/g, ""),
      incomplete.replace(
        /aria-label="Table of contents \d+"/g,
        'aria-label="Table of contents"',
      ),
    ]) {
      const target = editor()
      importDocument(target, "Keep existing", "markdown")
      const before = target.getEditorState()
      expect(() => parseDocument(input, "html")).toThrow()
      expect(() => importDocument(target, input, "html")).toThrow()
      expect(target.getEditorState()).toBe(before)
      expect(exportDocument(target, "markdown")).toContain("Keep existing")
    }
  }
})

test("HTML headings without IDs remain valid without a TOC", () => {
  const input = "<h2>First section</h2><h3>Nested section</h3>"
  const target = editor()

  expect(() => parseDocument(input, "html")).not.toThrow()

  importDocument(target, input, "html")

  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
    parseDocument(input, "html"),
  )
})

test("TOCs require every heading ID and complete matching entries", () => {
  const id1 = "yopem-toc-document-heading-1"
  const id2 = "yopem-toc-document-heading-2"
  const link1 = `<li><a href="#${id1}">First section</a></li>`
  const link2 = `<li><a href="#${id2}">Second section</a></li>`

  const nav = (links: string, label = "Table of contents") =>
    `<nav data-editor-toc="" aria-label="${label}"><ol>${links}</ol></nav>`

  const first = `<h2 id="${id1}">First section</h2>`
  const second = `<h3 id="${id2}">Second section</h3>`
  const complete = `${nav(link1 + link2)}${first}${second}`
  const withoutHeadings = `${nav("")}${nav("", "Table of contents")}`

  for (const input of [complete, withoutHeadings]) {
    const target = editor()
    expect(() => parseDocument(input, "html")).not.toThrow()
    importDocument(target, input, "html")
    expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
      parseDocument(input, "html"),
    )
  }

  const invalid = [
    `${nav("")}<h2>First section</h2>`,
    `${nav(link1)}${first}<h3>Second section</h3>`,
    `${nav(link2)}<h2>First section</h2>${second}`,
    `${nav(link1)}${first}${second}`,
    `${nav("")}${nav("")}<h2>First section</h2>`,
    `${nav(link1, "Table of contents 1")}${nav(link1, "Table of contents 2")}${first}<h3>Second section</h3>`,
    `${nav(link1 + link2, "Table of contents 1")}${nav(link1, "Table of contents 2")}${first}${second}`,
    `${nav(link1.replace("First section", "Wrong section") + link2)}${first}${second}`,
    `${nav(link1 + link2, "Table of contents 2")}${first}${second}`,
    `${nav(link1.replace(`#${id1}`, "javascript:alert(1)") + link2)}${first}${second}`,
    `${nav(link1.replace(`#${id1}`, `#${id2}`) + link2)}${first}${second}`,
  ]

  for (const input of invalid) {
    const bytes = Buffer.from(input)
    const target = editor()
    importDocument(target, "Keep existing", "markdown")
    const before = target.getEditorState()
    const beforeJSON = exportDocument(target, "json")

    expect(() => parseDocument(input, "html")).toThrow()
    expect(() => importDocument(target, input, "html")).toThrow()
    expect(Buffer.from(input)).toEqual(bytes)
    expect(target.getEditorState()).toBe(before)
    expect(exportDocument(target, "json")).toBe(beforeJSON)
  }
})

function inlineText(value: string) {
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

function reference(identifier: string) {
  return { type: "editor-footnote-reference", version: 1, identifier }
}

function inlineMath(tex: string) {
  return { type: "editor-math", version: 1, kind: "inline", tex }
}

function block(type: string, children: object[]) {
  return { type, version: 1, direction: null, format: "", indent: 0, children }
}

function richSource() {
  const heading = (children: object[]) => ({
    ...block("heading", children),
    tag: "h2",
  })

  const definition = (identifier: string) => ({
    ...block("editor-footnote-definition", [
      block("paragraph", [inlineText(identifier)]),
    ]),
    identifier,
  })

  return JSON.stringify({
    root: block("root", [
      block("paragraph", [reference("first")]),
      { type: "editor-toc", version: 1 },
      heading([
        inlineText("A <&> "),
        reference("first"),
        inlineText(" / "),
        inlineMath("x"),
        inlineText(" + "),
        inlineMath("\\frac{1}{2}"),
        inlineText(" / "),
        reference("missing"),
        inlineText(" / "),
        reference("first"),
      ]),
      block("quote", [
        heading([
          inlineText("Nested "),
          reference("other"),
          inlineText(" "),
          inlineMath("\\notARealCommand"),
        ]),
      ]),
      definition("other"),
      definition("first"),
      definition("first"),
      { type: "editor-toc", version: 1 },
    ]),
  })
}

function elements(nodes: RootContent[]): Element[] {
  return nodes.flatMap((node) =>
    node.type === "element" ? [node, ...elements(node.children)] : [],
  )
}

function inertText(node: RootContent): string {
  if (node.type === "text") return node.value

  if (node.type !== "element") return ""

  return node.tagName === "br" ? "\n" : node.children.map(inertText).join("")
}

function tocInput(label: string, heading: string) {
  const id = "yopem-toc-document-heading-1"

  return `<nav data-editor-toc=""><ol><li><a href="#${id}">${label}</a></li></ol></nav><h2 id="${id}">${heading}</h2>`
}

function rejectWithoutReplacement(input: string, format: "html" | "markdown") {
  const target = editor()
  importDocument(target, "Keep existing", "markdown")
  const before = target.getEditorState()
  const json = exportDocument(target, "json")
  expect(() => parseDocument(input, format)).toThrow()
  expect(() => importDocument(target, input, format)).toThrow()
  expect(target.getEditorState()).toBe(before)
  expect(exportDocument(target, "json")).toBe(json)
}

test("portable TOCs use occurrence text and TeX across HTML and Markdown", () => {
  const original = editor()
  importDocument(original, richSource(), "json")
  const expected = parseDocument(exportDocument(original, "json"), "json")

  for (const format of ["html", "markdown"] as const) {
    const output = exportDocument(original, format)
    expect(parseDocument(output, format)).toEqual(expected)
    const target = editor()
    importDocument(target, output, format)
    expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
      expected,
    )
  }

  const html = exportDocument(original, "html")
  const nodes = elements(parseHTMLSyntax(html).children)

  const navs = nodes.filter(
    (node) =>
      node.tagName === "nav" && node.properties.dataEditorToc !== undefined,
  )

  expect(navs).toHaveLength(2)

  for (const nav of navs) {
    const links = elements(nav.children).filter((node) => node.tagName === "a")
    expect(links.map(inertText)).toEqual([
      "A <&> 2 / x + \\frac{1}{2} / 3 / 4",
      "Nested 5 \\notARealCommand",
    ])
    expect(links.map((node) => node.properties.href)).toEqual([
      "#yopem-toc-document-heading-1",
      "#yopem-toc-document-heading-2",
    ])
  }

  const refs = nodes.filter(
    (node) => node.properties.dataEditorFootnoteReference !== undefined,
  )

  expect(refs.map(inertText)).toEqual(["1", "2", "3", "4", "5"])
  expect(
    refs.map(
      (node) =>
        elements(node.children).find((child) => child.tagName === "a")
          ?.properties.href,
    ),
  ).toEqual([
    "#yopem-footnote-definition-first-2",
    "#yopem-footnote-definition-first-2",
    undefined,
    "#yopem-footnote-definition-first-2",
    "#yopem-footnote-definition-other-1",
  ])
})

test("decoded footnote labels remain complete inert text", () => {
  const shown = "&lt;img src=x&gt; &amp; &#34;quoted&#34;"
  const reference = `<sup data-editor-footnote-reference="note">${shown}</sup>`
  const input = tocInput(`Section ${shown}`, `Section ${reference}`)
  const parsed = parseDocument(input, "html")
  const target = editor()
  importDocument(target, input, "html")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(parsed)
  const tree = parseHTMLSyntax(input)
  expect(elements(tree.children).some((node) => node.tagName === "img")).toBe(
    false,
  )
  expect(
    elements(tree.children)
      .find((node) => node.tagName === "sup")
      ?.children.every((node) => node.type === "text"),
  ).toBe(true)
  rejectWithoutReplacement(tocInput("Section", `Section ${reference}`), "html")
  rejectWithoutReplacement(
    tocInput("Section &lt;img src=x&gt;", `Section ${reference}`),
    "html",
  )
})

test("legacy marked reference labels include all surrounding decoded text", () => {
  const definition =
    '<div data-editor-footnote-definition="note" id="note-target"><p>Body</p></div>'

  const reference =
    '<sup data-editor-footnote-reference="note">before &amp; <a data-editor-footnote-reference-link="" href="#note-target">&lt;note&gt;</a> after &#33;</sup>'

  const heading = `Section ${reference}`

  const input =
    tocInput("Section before &amp; &lt;note&gt; after !", heading) + definition

  const target = editor()
  const expected = parseDocument(input, "html")
  importDocument(target, input, "html")
  expect(parseDocument(exportDocument(target, "json"), "json")).toEqual(
    expected,
  )

  for (const label of [
    "Section &lt;note&gt;",
    "Section before &amp; &lt;note&gt;",
    "Section note",
  ]) {
    rejectWithoutReplacement(tocInput(label, heading) + definition, "html")
  }

  rejectWithoutReplacement(
    tocInput(
      "Section before &amp; &lt;note&gt; after !",
      heading.replace("#note-target", "#missing"),
    ) + definition,
    "html",
  )
})

test("canonical rendered math accepts projected and complete legacy labels only", () => {
  const rendered = renderEditorMath({ kind: "inline", tex: "x" })
  expect(rendered.ok).toBe(true)

  if (!rendered.ok) throw new Error("Expected canonical MathML")
  const math = `<span data-editor-math="inline" data-editor-tex="x">${rendered.html}</span>`

  const oldText = parseHTMLSyntax(rendered.html)
    .children.map(inertText)
    .join("")

  const projected = tocInput("A x B", `A ${math} B`)
  const legacy = tocInput(`A ${oldText} B`, `A ${math} B`)
  expect(parseDocument(projected, "html")).toEqual(
    parseDocument(legacy, "html"),
  )
  expect(
    parseDocument(
      tocInput(
        "A x B",
        'A <span data-editor-math="inline" data-editor-tex="x">x</span> B',
      ),
      "html",
    ),
  ).toEqual(parseDocument(projected, "html"))
  const mixed = tocInput(`A x ${oldText} B`, `A ${math} ${math} B`)
  rejectWithoutReplacement(mixed, "html")

  for (const input of [
    projected.replace("<mi>x</mi>", "<mi>y</mi>"),
    projected.replace(">x</annotation>", ">y</annotation>"),
    projected.replace("<mi>x</mi>", '<mi onclick="alert(1)">x</mi>'),
    projected.replace('data-editor-tex="x"', 'data-editor-tex="y"'),
    projected.replace('data-editor-math="inline"', 'data-editor-math="block"'),
    projected.replace("</math>", "<mtext>extra</mtext></math>"),
    projected.replace('data-editor-tex="x"', 'data-editor-tex="\\href{x}{y}"'),
    projected.replace(">A x B</a>", ">A y B</a>"),
    projected.replace(">A x B</a>", "><strong>A x B</strong></a>"),
  ]) {
    expect(input).not.toBe(projected)
    rejectWithoutReplacement(input, "html")
    rejectWithoutReplacement(input, "markdown")
  }
})

test("portable labels retain all headings and full text beyond live display limits", () => {
  const long = "Long " + "x".repeat(300)

  const root = block("root", [
    { type: "editor-toc", version: 1 },
    ...Array.from({ length: 501 }, (_, index) => ({
      ...block("heading", [
        inlineText(index === 500 ? long : `Heading ${index}`),
      ]),
      tag: "h2",
    })),
  ])

  const original = editor()
  importDocument(original, JSON.stringify({ root }), "json")
  const html = exportDocument(original, "html")
  const nodes = elements(parseHTMLSyntax(html).children)
  const nav = nodes.find((node) => node.tagName === "nav")

  if (!nav) throw new Error("Missing TOC")
  const links = elements(nav.children).filter((node) => node.tagName === "a")
  expect(links).toHaveLength(501)
  expect(inertText(links[500])).toBe(long)
  expect(parseDocument(html, "html")).toEqual(
    parseDocument(exportDocument(original, "json"), "json"),
  )
  rejectWithoutReplacement("x".repeat(1048577), "html")
})

test("invalid TOC labels, links and nested structures reject without mutation", () => {
  const html = exportedHTML()
  const single = exportedHTML(1)
  const first = 'aria-label="Table of contents 1"'
  const second = 'aria-label="Table of contents 2"'
  const id1 = "yopem-toc-document-heading-1"
  const id2 = "yopem-toc-document-heading-2"

  const invalid = [
    single.replace('aria-label="Table of contents"', first),
    html.replace(first, 'aria-label="Table of contents 0"'),
    html.replace(first, 'aria-label="Table of contents 01"'),
    html.replace(first, 'aria-label="Table of contents 3"'),
    html.replace(first, second),
    html.replace(second, first),
    html.replace(first, 'aria-label="Table of contents 1 extra"'),
    html.replace(first, 'aria-label="Other"'),
    html.replace(first, `${first} onclick="alert(1)"`),
    html.replace(`href="#${id1}"`, 'href="#missing"'),
    html.replace(`href="#${id1}"`, `href="#${id2}"`),
    html
      .replace(`href="#${id1}"`, 'href="#temporary"')
      .replace(`href="#${id2}"`, `href="#${id1}"`)
      .replace('href="#temporary"', `href="#${id2}"`),
    html.replace(`id="${id2}"`, `id="${id1}"`),
    html.replace(">First section</a>", ">Wrong section</a>"),
    html.replace(`href="#${id1}"`, 'href="javascript:alert(1)"'),
    html.replace("<ol>", '<ol><nav data-editor-toc=""><ol></ol></nav>'),
    html.replace("<li>", "<li><div>injected</div>"),
  ]

  for (const input of invalid) {
    expect(input).not.toBe(html)
    const target = editor()
    importDocument(target, "Keep existing", "markdown")
    const before = target.getEditorState()
    expect(() => parseDocument(input, "html")).toThrow()
    expect(() => importDocument(target, input, "html")).toThrow()
    expect(target.getEditorState()).toBe(before)
  }
})
