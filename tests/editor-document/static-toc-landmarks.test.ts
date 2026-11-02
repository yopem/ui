import { createStaticTocFixture } from "@workspace/tests/fixtures/static-toc"
import {
  DocumentError,
  exportDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

for (const count of [1, 2, 3]) {
  test(`static server rendering preserves ${count} contents landmarks`, () => {
    expect("window" in globalThis).toBe(false)
    expect("document" in globalThis).toBe(false)
    const { editor, html } = createStaticTocFixture(count)
    const before = exportDocument(editor, "json")
    const parsed = parseDocument(html, "html")
    const json = parseDocument(before, "json")

    for (const root of [json.root, parsed.root]) {
      if (count === 1) expect(root).not.toHaveProperty("$slots")
      else
        expect(root).toHaveProperty("$slots", {
          contents: { type: "editor-toc", version: 1 },
        })
    }

    const output = renderToStaticMarkup(
      createElement(DocumentStatic, {
        html,
        "aria-label": "Published document",
      }),
    )

    const document = parseHTML(output).document

    const section = document.querySelector(
      'section[aria-label="Published document"]',
    )

    const navs = Array.from(
      section?.querySelectorAll("nav[data-editor-toc]") ?? [],
    )

    expect(navs.map((nav) => nav.getAttribute("aria-label"))).toEqual(
      Array.from({ length: count }, (_, index) =>
        count === 1
          ? "Published document: Table of contents"
          : `Published document: Table of contents ${index + 1}`,
      ),
    )

    if (count > 1)
      expect(
        navs.at(-1)?.closest('[data-editor-slot="contents"]'),
      ).not.toBeNull()

    for (const nav of navs) {
      const links = Array.from(nav.querySelectorAll("a"))
      expect(links.map((link) => link.textContent)).toEqual([
        "First section",
        "Nested section",
      ])

      for (const link of links) {
        const target = link.getAttribute("href") ?? ""
        expect(target).toMatch(/^#yopem-toc-/)
        expect(document.querySelectorAll(target)).toHaveLength(1)
        expect(document.querySelector(target)?.textContent).toBe(
          link.textContent,
        )
      }
    }

    expect(exportDocument(editor, "json")).toBe(before)
    expect(parseDocument(html, "html")).toEqual(parsed)
  })
}

test("static rendering keeps the default single landmark name and rejects unsafe TOC props", () => {
  const { html } = createStaticTocFixture(1)
  const output = renderToStaticMarkup(createElement(DocumentStatic, { html }))
  const document = parseHTML(output).document
  expect(document.querySelector("nav")?.getAttribute("aria-label")).toBe(
    "Static document: Table of contents",
  )
  expect(() =>
    renderToStaticMarkup(
      createElement(DocumentStatic, {
        html: html.replace(
          "data-editor-toc",
          'onclick="alert(1)" data-editor-toc',
        ),
      }),
    ),
  ).toThrow(DocumentError)
})
