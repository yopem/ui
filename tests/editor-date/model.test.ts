import {
  editorDateFromCalendarDate,
  editorDateFromHTMLAttributes,
  editorDateFromMarkdown,
  editorDateHTMLAttributes,
  editorDateToCalendarDate,
  editorDateToMarkdown,
  formatEditorDate,
  parseEditorDate,
  parseEditorDateJSON,
  validateEditorDateJSON,
  validateEditorDateHTML,
} from "@editor/date-model"
import { describe, expect, test } from "bun:test"
import { parseHTML } from "linkedom"

test("date HTML validation uses the supplied DOM, not ambient constructors", () => {
  const valid = parseHTML(
    '<time data-editor-date="1" datetime="2024-02-29">2024-02-29</time>',
  ).document

  expect(() => validateEditorDateHTML(valid)).not.toThrow()

  for (const html of [
    '<time data-editor-date="1" datetime="2023-02-29">2023-02-29</time>',
    '<time data-editor-date="1" datetime="2024-02-29">Different</time>',
  ]) {
    const document = parseHTML(html).document

    expect(() => validateEditorDateHTML(document)).toThrow()
  }
})

describe("canonical editor dates", () => {
  test("validates Gregorian dates without accepting normalization", () => {
    expect(parseEditorDate("2024-02-29")).toBe("2024-02-29")
    expect(parseEditorDate("2000-02-29")).toBe("2000-02-29")

    for (const value of [
      "1900-02-29",
      "2023-02-29",
      "2024-00-01",
      "2024-13-01",
      "2024-04-31",
      "0000-01-01",
      "2024-1-01",
      "2024-01-01T00:00:00Z",
      "2024-01-01\n",
    ])
      expect(() => parseEditorDate(value)).toThrow()
  })

  test("formats in locale without changing the represented calendar day", () => {
    const us = formatEditorDate("2024-01-01", "en-US")
    const uk = formatEditorDate("2024-01-01", "en-GB")

    expect(us).toContain("2024")
    expect(uk).toContain("2024")
    expect(us).not.toBe(uk)
    expect(
      editorDateFromCalendarDate(editorDateToCalendarDate("2024-01-01")),
    ).toBe("2024-01-01")
    expect(() => editorDateFromCalendarDate(new Date(Number.NaN))).toThrow()
  })
})

test("date JSON, HTML metadata, and Markdown fragments roundtrip safely", () => {
  const value = {
    root: {
      type: "root",
      children: [{ type: "editor-date", version: 1, date: "2024-01-01" }],
    },
  }

  expect(validateEditorDateJSON(value)).toBeUndefined()
  expect(parseEditorDateJSON(JSON.stringify(value))).toEqual(value)
  expect(() =>
    validateEditorDateJSON({
      root: {
        type: "root",
        children: [{ type: "editor-date", version: 1, date: "2024-02-30" }],
      },
    }),
  ).toThrow()
  expect(() => parseEditorDateJSON(" ".repeat(1_048_577))).toThrow()

  const attributes = editorDateHTMLAttributes("2024-01-01")
  expect(editorDateFromHTMLAttributes(attributes)).toBe("2024-01-01")
  expect(() =>
    editorDateFromHTMLAttributes({
      ...attributes,
      datetime: "2024-01-01T12:00:00Z",
    }),
  ).toThrow()

  const markdown = editorDateToMarkdown("2024-01-01")
  expect(editorDateFromMarkdown(markdown)).toBe("2024-01-01")
  expect(() =>
    editorDateFromMarkdown('<time datetime="2024-01-01">other</time>'),
  ).toThrow()
})
