import { createHeadlessEditor } from "@lexical/headless"
import { $generateHtmlFromNodes } from "@lexical/html"
import { createEditorBlockPresentationHTMLConfig } from "@yopem-ui/editor/block-presentation-extension"
import {
  documentNodes,
  parseDocument,
  importDocument,
  exportDocument,
  DocumentError,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"

const title = '<strong>Rich <a href="https://example.com">title</a></strong>'

const content =
  '<ul><li><p>Nested</p></li></ul><table><tr data-editor-row-height="48"><td><p>Cell</p></td></tr></table>'

function canonical(open = false, label = "Rich title", heading = title) {
  return `<section data-editor-toggle><div data-editor-toggle-summary>${heading}</div><details data-editor-toggle-body${open ? " open" : ""}><summary data-editor-toggle-control contenteditable="false" aria-label="${label}"></summary><div data-editor-toggle-content>${content}</div></details></section>`
}

function editor() {
  return createHeadlessEditor({
    namespace: "accessible-document",
    nodes: documentNodes,
    html: createEditorBlockPresentationHTMLConfig(),
    onError(error) {
      throw error
    },
  })
}

test.each([false, true])("canonical and legacy fidelity, open=%s", (open) => {
  const legacy = `<details data-editor-toggle${open ? " open" : ""}><summary>${title}</summary><div data-editor-toggle-body>${content}</div></details>`
  const expected = parseDocument(legacy, "html")
  expect(parseDocument(canonical(open), "html")).toEqual(expected)
  const instance = editor()
  importDocument(instance, canonical(open), "html")

  for (const format of ["html", "markdown", "json"] as const) {
    const output = exportDocument(instance, format)
    expect(parseDocument(output, format)).toEqual(expected)

    if (format === "html") {
      const document = parseHTML(output).document
      const section = document.querySelector("section[data-editor-toggle]")
      expect(section?.hasAttribute("open")).toBe(false)
      expect(section?.querySelector("details")?.hasAttribute("open")).toBe(open)
      expect(section?.querySelector("summary")?.textContent).toBe("")
      expect(
        section?.querySelector("summary")?.getAttribute("aria-label"),
      ).toBe("Rich title")
      expect(section?.querySelector("summary a")).toBeNull()
      expect(
        section
          ?.querySelector("[data-editor-toggle-summary] a")
          ?.getAttribute("href"),
      ).toBe("https://example.com")
    }
  }
})

test("empty title keeps disclosure name without model text", () => {
  const instance = editor()
  importDocument(instance, canonical(false, "Toggle content", ""), "html")
  const html = exportDocument(instance, "html")
  expect(
    parseHTML(html)
      .document.querySelector("summary")
      ?.getAttribute("aria-label"),
  ).toBe("Toggle content")
  expect(parseDocument(html, "html")).toEqual(
    instance.getEditorState().toJSON(),
  )
})

const valid = canonical()

const invalid = [
  valid.replace("<section", "<article").replace("</section>", "</article>"),
  valid.replace(
    "<section data-editor-toggle>",
    "<section data-editor-toggle open>",
  ),
  valid.replace("data-editor-toggle-summary", "data-editor-toggle-content"),
  valid.replace("data-editor-toggle-body", "data-editor-toggle-summary"),
  valid.replace("data-editor-toggle-control", "data-editor-toggle-body"),
  valid.replace("data-editor-toggle-content", "data-editor-toggle-summary"),
  valid.replace("</summary>", "hidden</summary>"),
  valid.replace("</summary>", "<span></span></summary>"),
  valid.replace('contenteditable="false"', 'contenteditable="true"'),
  valid.replace('aria-label="Rich title"', 'aria-label="Other"'),
  valid.replace(
    "<div data-editor-toggle-content>",
    '<div data-editor-toggle-content style="color: red">',
  ),
  valid.replace("</details>", "<p>Extra</p></details>"),
  valid.replace("</section>", "<p>Extra</p></section>"),
  valid.replace(title, "<p>Block</p>"),
  valid.replace(
    '<summary data-editor-toggle-control contenteditable="false" aria-label="Rich title"></summary>',
    "",
  ),
  '<summary data-editor-toggle-control contenteditable="false" aria-label="Toggle content"></summary>',
  "<div data-editor-toggle-summary>Orphan</div>",
  "<div data-editor-toggle-content><p>Orphan</p></div>",
  "<details data-editor-toggle-body><summary></summary></details>",
  "<details data-editor-toggle><summary>Title</summary><div data-editor-toggle-body><p>Body</p></div><div data-editor-toggle-body><p>Duplicate</p></div></details>",
]

test.each(invalid)(
  "malformed owned HTML fails before replacement: %s",
  (html) => {
    const instance = editor()
    importDocument(instance, "Before", "markdown")
    const before = instance.getEditorState()
    expect(() => parseDocument(html, "html")).toThrow(DocumentError)
    expect(() => importDocument(instance, html, "html")).toThrow(DocumentError)
    expect(instance.getEditorState()).toBe(before)
  },
)

test("native canonical export imports without control text", () => {
  const window = parseHTML("<!doctype html><html><body></body></html>").window
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")

  const previousDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  )

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: window,
  })
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: window.document,
  })

  try {
    const instance = editor()
    importDocument(
      instance,
      `<details data-editor-toggle><summary>${title}</summary><div data-editor-toggle-body>${content}</div></details>`,
      "html",
    )

    const html = instance
      .getEditorState()
      .read(() => $generateHtmlFromNodes(instance), { editor: instance })

    const parsed = parseDocument(html, "html")
    const next = editor()
    importDocument(next, JSON.stringify(parsed), "json")
    expect(parseDocument(exportDocument(next, "html"), "html")).toEqual(parsed)
    expect(parseHTML(html).document.querySelector("summary")?.textContent).toBe(
      "",
    )
  } finally {
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")

    if (previousDocument)
      Object.defineProperty(globalThis, "document", previousDocument)
    else Reflect.deleteProperty(globalThis, "document")
  }
})
