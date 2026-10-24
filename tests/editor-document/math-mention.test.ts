import { createDocumentEditor } from "@editor/document/convert"
import { createHeadlessEditor } from "@lexical/headless"
import {
  DocumentError,
  exportDocument,
  importDocument,
  htmlDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { renderEditorMath } from "@yopem-ui/editor/math-render"
import { describe, expect, test } from "bun:test"
import { $getRoot } from "lexical"

const mention =
  '<span data-mention-id="user:42" data-mention-label="Ada Lovelace">@Ada Lovelace</span>'

const math = '<span data-editor-math="inline" data-editor-tex="x^2">x^2</span>'

function roundTrip(source: string, format: "html" | "markdown") {
  const editor = createDocumentEditor()
  importDocument(editor, source, format)

  return { editor, json: exportDocument(editor, "json") }
}

describe("canonical document math and mentions", () => {
  test("retains identities, math kind and TeX across every format", () => {
    const { editor, json } = roundTrip(
      `<p>${mention}${math}</p><div data-editor-math="block" data-editor-tex="y">y</div>`,
      "html",
    )

    for (const format of ["json", "html", "markdown"] as const) {
      expect(parseDocument(exportDocument(editor, format), format)).toEqual(
        JSON.parse(json),
      )
    }
  })

  test("imports canonical percent-encoded mention syntax and math delimiters", () => {
    const { json } = roundTrip(
      "@[Ada%20Lovelace](mention:user%3A42) $x^2$\n\n$$\ny\n$$",
      "markdown",
    )

    expect(json).toContain('"id":"user:42"')
    expect(json).toContain('"kind":"inline"')
    expect(json).toContain('"kind":"block"')
  })

  test("retains mention text formats and safe styles", () => {
    const { editor, json } = roundTrip(
      `<p><strong><em>${mention}</em></strong></p>`,
      "html",
    )

    expect(parseDocument(exportDocument(editor, "html"), "html")).toEqual(
      JSON.parse(json),
    )
  })

  test("uses canonical HTML for ambiguous math without losing TeX", () => {
    const { editor, json } = roundTrip(
      '<p><span data-editor-math="inline" data-editor-tex="a$b">a$b</span></p>',
      "html",
    )

    const markdown = exportDocument(editor, "markdown")
    expect(markdown).toContain("data-editor-math")
    expect(parseDocument(markdown, "markdown")).toEqual(JSON.parse(json))
  })

  for (const html of [
    '<p><span data-mention-id="u" data-mention-label="Ada">@Other</span></p>',
    '<p><span data-mention-id="u">@Ada</span></p>',
    '<p><span data-editor-math="inline" data-editor-tex="x">y</span></p>',
    '<div data-editor-math="inline" data-editor-tex="x">x</div>',
    '<p><span data-editor-math="inline" data-editor-tex="\\href{x}{y}">x</span></p>',
    '<p><span data-mention-id="u" data-mention-label="Ada" data-editor-math="inline" data-editor-tex="x">x</span></p>',
  ]) {
    test(`rejects invalid metadata: ${html}`, () => {
      expect(() => parseDocument(html, "html")).toThrow()
    })
  }

  test("rejects missing target registrations without changing content", () => {
    const editor = createHeadlessEditor({
      namespace: "no-optional-nodes",
      onError(error) {
        throw error
      },
    })

    const original = editor.getEditorState()
    expect(() =>
      importDocument(editor, `<p>${mention}${math}</p>`, "html"),
    ).toThrow(DocumentError)
    expect(editor.getEditorState()).toBe(original)
    expect(editor.read(() => $getRoot().getTextContent())).toBe("")
  })

  test("keeps code literal and rejects unsafe mention destinations", () => {
    expect(roundTrip("`$x$ @[Ada](mention:u)`", "markdown").json).not.toContain(
      '"identity"',
    )
    expect(() => parseDocument("@[Ada](mention:%ZZ)", "markdown")).toThrow()
  })

  test("keeps future media and review nodes unsupported", () => {
    for (const type of ["image", "video", "mark", "review"]) {
      expect(() =>
        parseDocument(
          JSON.stringify({
            root: {
              type: "root",
              version: 1,
              children: [{ type, version: 1 }],
              direction: null,
              format: "",
              indent: 0,
            },
          }),
          "json",
        ),
      ).toThrow()
    }
  })

  test("keeps math bounds and document byte limits", () => {
    expect(() =>
      parseDocument(
        `<p><span data-editor-math="inline" data-editor-tex="${"x".repeat(4097)}">x</span></p>`,
        "html",
      ),
    ).toThrow()
    expect(() => parseDocument("x".repeat(1048577), "markdown")).toThrow(
      DocumentError,
    )
  })
})

describe("document math Markdown and display boundaries", () => {
  test("exports interoperable delimiters and preserves surrounding Markdown", () => {
    const { editor, json } = roundTrip(
      '<p>Before <span data-editor-math="inline" data-editor-tex="x^2">x^2</span> after</p><div data-editor-math="block" data-editor-tex="\\frac{1}{2}">\\frac{1}{2}</div>',
      "html",
    )

    const markdown = exportDocument(editor, "markdown")
    expect(markdown).toContain("$x^2$")
    expect(markdown).toContain("$$\n\\frac{1}{2}\n$$")
    expect(parseDocument(markdown, "markdown")).toEqual(JSON.parse(json))
  })

  for (const tex of [" x ", "x\ny", "x|y", "x$y", "x\n\n y", "x\n$$\ny"]) {
    test(`preserves exact TeX through Markdown fallback: ${JSON.stringify(tex)}`, () => {
      const source = `<p><span data-editor-math="inline" data-editor-tex="${tex.replaceAll("\r", "&#13;").replaceAll("\n", "&#10;")}">${tex.replaceAll("\r", "&#13;").replaceAll("\n", "&#10;")}</span></p>`
      const { editor, json } = roundTrip(source, "html")
      const markdown = exportDocument(editor, "markdown")
      expect(parseDocument(markdown, "markdown")).toEqual(JSON.parse(json))
    })
  }

  test("parses math inside emphasis, links, lists and tables without touching code or escaped currency", () => {
    const source =
      "**label** $x$ [value $y$](https://example.com)\n\n- $z$\n\n| Formula |\n| --- |\n| $q$ |\n\n`$code$` and \\$5\n\n```tex\n$literal$\n```"

    const { editor, json } = roundTrip(source, "markdown")
    expect((json.match(/"type":"editor-math"/g) ?? []).length).toBe(4)
    expect(
      parseDocument(exportDocument(editor, "markdown"), "markdown"),
    ).toEqual(JSON.parse(json))
  })

  test("renders native MathML and accepts only regenerated display content", () => {
    const { editor, json } = roundTrip(`<p>${math}</p>`, "html")
    const html = exportDocument(editor, "html")
    expect(html).toContain("<math")
    expect(html).toContain("<msup>")
    expect(htmlDocument(editor)).toContain("<math")
    expect(parseDocument(html, "html")).toEqual(JSON.parse(json))
    expect(() =>
      parseDocument(
        html.replace("<msup>", '<msup onclick="alert(1)">'),
        "html",
      ),
    ).toThrow()
    expect(() =>
      parseDocument(html.replace("<mi>x</mi>", "<mi>y</mi>"), "html"),
    ).toThrow()
    expect(() => parseDocument("<math><mi>x</mi></math>", "html")).toThrow()
    expect(() =>
      parseDocument(
        '<span data-editor-math="inline" data-editor-tex="x"><math><mi>x</mi></math></span>',
        "html",
      ),
    ).toThrow()
  })

  test("retains invalid TeX literally rather than replacing document content", () => {
    const { editor, json } = roundTrip(
      '<p><span data-editor-math="inline" data-editor-tex="\\notARealCommand">\\notARealCommand</span></p>',
      "html",
    )

    expect(
      renderEditorMath({ kind: "inline", tex: "\\notARealCommand" }).ok,
    ).toBe(false)
    const html = exportDocument(editor, "html")
    expect(html).not.toContain("<math")
    expect(html).toContain("\\notARealCommand")
    expect(parseDocument(html, "html")).toEqual(JSON.parse(json))
  })
})
