import { staticPrefixDocument } from "@workspace/tests/fixtures/static-prefix-document"
import { createStaticTocFixture } from "@workspace/tests/fixtures/static-toc"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ZodError } from "zod"

function fixture() {
  return `${staticPrefixDocument()}<p><a href="https://example.com/path#anchor">external</a></p>`
}

function render(html: string, idPrefix?: string) {
  return renderToStaticMarkup(
    createElement(DocumentStatic, {
      html,
      idPrefix,
      "aria-label": "Published document",
    }),
  )
}

test("default output keeps canonical IDs and links", () => {
  const html = fixture()
  const document = parseHTML(render(html)).document
  const ids = Array.from(document.querySelectorAll("[id]"), (node) => node.id)
  expect(ids).toContain("yopem-toc-document-heading-1")
  expect(ids).toContain("yopem-footnote-reference-note-1")
  expect(ids).toContain("yopem-footnote-definition-note-1")
  expect(
    Array.from(
      document.querySelectorAll("[data-editor-footnote-reference]"),
      (reference) => [
        reference.id,
        reference.querySelector("a")?.getAttribute("href"),
      ],
    ),
  ).toEqual([
    ["yopem-footnote-reference-note-1", "#yopem-footnote-definition-note-1"],
    ["yopem-footnote-reference-note-2", "#yopem-footnote-definition-note-1"],
    ["yopem-footnote-reference-missing-3", undefined],
  ])
  expect(
    Array.from(
      document.querySelectorAll("[data-editor-footnote-definition]"),
      (definition) => [
        definition.id,
        Array.from(
          definition.querySelectorAll("[data-editor-footnote-backlink]"),
          (link) => link.getAttribute("href"),
        ),
      ],
    ),
  ).toEqual([
    [
      "yopem-footnote-definition-note-1",
      ["#yopem-footnote-reference-note-1", "#yopem-footnote-reference-note-2"],
    ],
    [
      "yopem-footnote-definition-note-2",
      ["#yopem-footnote-reference-note-1", "#yopem-footnote-reference-note-2"],
    ],
  ])
  expect(
    document.querySelector('a[href="https://example.com/path#anchor"]'),
  ).not.toBeNull()

  for (const link of document.querySelectorAll('a[href^="#"]')) {
    expect(
      document.getElementById(link.getAttribute("href")?.slice(1) ?? ""),
    ).not.toBeNull()
  }
})

test("distinct prefixes isolate all rendered IDs and local relationships", () => {
  const html = fixture()
  const baseline = parseHTML(render(html)).document

  const originalIds = Array.from(
    baseline.querySelectorAll("[id]"),
    (node) => node.id,
  )

  const originalHrefs = Array.from(
    baseline.querySelectorAll('[href^="#"]'),
    (node) => node.getAttribute("href"),
  )

  const document = parseHTML(
    `<main>${render(html, "first")}${render(html, "second")}</main>`,
  ).document

  const sections = document.querySelectorAll(
    'section[aria-label="Published document"]',
  )

  expect(sections).toHaveLength(2)

  const allIds = Array.from(
    document.querySelectorAll("[id]"),
    (node) => node.id,
  )

  expect(new Set(allIds).size).toBe(allIds.length)

  for (const [index, prefix] of ["first", "second"].entries()) {
    const section = sections[index]
    expect(section).toBeDefined()

    if (!section) throw new Error("Missing section")
    expect(
      Array.from(section.querySelectorAll("[id]"), (node) => node.id),
    ).toEqual(originalIds.map((id) => `${prefix}--${id}`))
    const links = Array.from(section.querySelectorAll('[href^="#"]'))
    expect(links.map((node) => node.getAttribute("href"))).toEqual(
      originalHrefs.map((href) => `#${prefix}--${href?.slice(1)}`),
    )

    for (const link of links) {
      const target = document.getElementById(
        link.getAttribute("href")?.slice(1) ?? "",
      )

      expect(target).not.toBeNull()
      expect(section.contains(target)).toBe(true)
    }

    const attributes = [
      "aria-activedescendant",
      "aria-controls",
      "aria-describedby",
      "aria-details",
      "aria-errormessage",
      "aria-flowto",
      "aria-labelledby",
      "aria-owns",
      "headers",
      "for",
    ]

    for (const node of section.querySelectorAll(
      attributes.map((name) => `[${name}]`).join(","),
    )) {
      for (const attribute of attributes) {
        const value = node.getAttribute(attribute)

        if (value)
          for (const id of value.split(/\s+/))
            expect(section.contains(document.getElementById(id))).toBe(true)
      }
    }

    const references = Array.from(
      section.querySelectorAll("[data-editor-footnote-reference]"),
    )

    expect(references.map((reference) => reference.id)).toEqual([
      `${prefix}--yopem-footnote-reference-note-1`,
      `${prefix}--yopem-footnote-reference-note-2`,
      `${prefix}--yopem-footnote-reference-missing-3`,
    ])
    expect(
      references.map((reference) =>
        reference.querySelector("a")?.getAttribute("href"),
      ),
    ).toEqual([
      `#${prefix}--yopem-footnote-definition-note-1`,
      `#${prefix}--yopem-footnote-definition-note-1`,
      undefined,
    ])

    const definitions = Array.from(
      section.querySelectorAll("[data-editor-footnote-definition]"),
    )

    expect(definitions.map((definition) => definition.id)).toEqual([
      `${prefix}--yopem-footnote-definition-note-1`,
      `${prefix}--yopem-footnote-definition-note-2`,
    ])
    expect(
      definitions.map((definition) =>
        Array.from(
          definition.querySelectorAll("[data-editor-footnote-backlink]"),
          (link) => [link.getAttribute("href"), link.textContent],
        ),
      ),
    ).toEqual([
      [
        [`#${prefix}--yopem-footnote-reference-note-1`, "↩ 1"],
        [`#${prefix}--yopem-footnote-reference-note-2`, "↩ 2"],
      ],
      [
        [`#${prefix}--yopem-footnote-reference-note-1`, "↩ 1"],
        [`#${prefix}--yopem-footnote-reference-note-2`, "↩ 2"],
      ],
    ])

    expect(
      Array.from(section.querySelectorAll("nav[data-editor-toc]"), (nav) =>
        nav.getAttribute("aria-label"),
      ),
    ).toEqual([
      "Published document: Table of contents 1",
      "Published document: Table of contents 2",
    ])
    expect(section.querySelectorAll("[data-editor-math] math")).toHaveLength(1)
    expect(
      section.querySelector('a[href="https://example.com/path#anchor"]'),
    ).not.toBeNull()
  }
})

test("single TOC landmark retains its name with and without a prefix", () => {
  const { html } = createStaticTocFixture(1)

  for (const prefix of [undefined, "first"]) {
    const document = parseHTML(render(html, prefix)).document

    expect(
      document
        .querySelector("nav[data-editor-toc]")
        ?.getAttribute("aria-label"),
    ).toBe("Published document: Table of contents")
  }
})

test("valid prefix boundaries do not collide", () => {
  const html = fixture()

  const document = parseHTML(
    `<main>${render(html, "a")}${render(html, "a-")}${render(html, "z".repeat(64))}</main>`,
  ).document

  const ids = Array.from(document.querySelectorAll("[id]"), (node) => node.id)
  expect(new Set(ids).size).toBe(ids.length)

  for (const prefix of ["a", "a-", "z".repeat(64)]) {
    expect(
      document.getElementById(`${prefix}--yopem-toc-document-heading-1`),
    ).not.toBeNull()
  }
})

test.each([
  "",
  "a b",
  "a\n",
  "a--b",
  "#bad",
  'x" onmouseover="alert(1)',
  "a".repeat(65),
  "é",
  "1start",
])("invalid prefix rejects before markup is returned: %s", (idPrefix) => {
  const html = fixture()
  expect(render(html)).not.toBeEmpty()
  expect(() => render(html, idPrefix)).toThrow(ZodError)
})

test("duplicate prefixes remain host responsibility", () => {
  const html = fixture()

  const document = parseHTML(
    `<main>${render(html, "same")}${render(html, "same")}</main>`,
  ).document

  expect(
    document.querySelectorAll('[id="same--yopem-toc-document-heading-1"]'),
  ).toHaveLength(2)
})
