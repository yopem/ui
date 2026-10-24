import {
  parseEditorFootnoteId,
  parseEditorFootnoteMarkdown,
  serializeEditorFootnoteMarkdown,
  validateEditorFootnoteClipboardHTML,
  validateEditorFootnoteClipboardJSON,
  validateEditorFootnotesHTML,
  validateEditorFootnotesJSON,
} from "@editor/footnote-model"
import { expect, test } from "bun:test"

const richBody = {
  type: "paragraph",
  version: 1,
  direction: null,
  format: "",
  indent: 0,
  children: [
    {
      type: "text",
      version: 1,
      text: "Rich ",
      detail: 0,
      format: 0,
      mode: "normal",
      style: "",
    },
    {
      type: "text",
      version: 1,
      text: "body",
      detail: 0,
      format: 1,
      mode: "normal",
      style: "",
    },
  ],
}

const definition = (identifier: string) => ({
  type: "editor-footnote-definition",
  version: 1,
  identifier,
  direction: null,
  format: "",
  indent: 0,
  children: [richBody],
})

const reference = (identifier: string) => ({
  type: "editor-footnote-reference",
  version: 1,
  identifier,
})

const document = (children: unknown[]) => ({
  root: { type: "root", version: 1, children },
})

test("footnote identifiers stay bounded and safe for HTML and Markdown", () => {
  expect(parseEditorFootnoteId("section-2")).toBe("section-2")
  expect(() => parseEditorFootnoteId("")).toThrow()
  expect(() => parseEditorFootnoteId("../notes")).toThrow()
  expect(() => parseEditorFootnoteId("x".repeat(65))).toThrow()
})

test("footnote JSON retains unresolved and repeated references with duplicate rich definitions", () => {
  const value = document([
    reference("1"),
    reference("1"),
    reference("missing"),
    definition("3"),
    definition("3"),
  ])

  const original = structuredClone(value)

  expect(() => validateEditorFootnotesJSON(value)).not.toThrow()
  expect(value).toEqual(original)
})

test("clipboard footnote fragments preserve rich content and allow unresolved references", () => {
  const value = document([reference("external"), definition("local")])
  const original = structuredClone(value)

  expect(() => validateEditorFootnoteClipboardJSON(value)).not.toThrow()
  expect(value).toEqual(original)

  const duplicateDefinitions = document([
    definition("duplicate"),
    definition("duplicate"),
  ])

  const originalDuplicates = structuredClone(duplicateDefinitions)

  expect(() =>
    validateEditorFootnoteClipboardJSON(duplicateDefinitions),
  ).not.toThrow()
  expect(duplicateDefinitions).toEqual(originalDuplicates)
})

test("footnote HTML validates complete documents and safe clipboard fragments", () => {
  const rich =
    '<p>Text<sup data-editor-footnote-reference="1">1</sup></p><div data-editor-footnote-definition="1"><p><strong>Rich body</strong></p></div>'

  expect(() => validateEditorFootnotesHTML(rich)).not.toThrow()
  expect(() =>
    validateEditorFootnoteClipboardHTML(
      '<sup data-editor-footnote-reference="remote">1</sup>',
    ),
  ).not.toThrow()
  expect(() =>
    validateEditorFootnoteClipboardHTML(
      '<div data-editor-footnote-definition="1"><p>One</p></div><div data-editor-footnote-definition="1"><p>Two</p></div>',
    ),
  ).not.toThrow()
  expect(() =>
    validateEditorFootnotesHTML(
      '<p><sup data-editor-footnote-reference="missing">1</sup></p>',
    ),
  ).not.toThrow()
})

test("GFM footnote Markdown keeps rich definition content and rejects dangling references", () => {
  const source = "A note[^a].\n\n[^a]: **Rich** body with `code`."
  const parsed = parseEditorFootnoteMarkdown(source)
  const serialized = serializeEditorFootnoteMarkdown(parsed)

  expect(serialized).toContain("[^a]")
  expect(serialized).toContain("**Rich**")
  expect(serialized).toContain("`code`")
  expect(() => parseEditorFootnoteMarkdown("A note[^missing].")).not.toThrow()
  expect(() =>
    parseEditorFootnoteMarkdown("A note[^a].\n\n[^a]: One.\n\n[^a]: Two."),
  ).not.toThrow()
})
