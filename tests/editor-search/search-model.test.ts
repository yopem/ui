import {
  EDITOR_SEARCH_QUERY_LIMIT,
  EDITOR_SEARCH_RESULT_LIMIT,
  findEditorSearchMatches,
  normalizeEditorSearchQuery,
} from "@editor/search-model"
import { describe, expect, test } from "bun:test"

describe("editor search model", () => {
  test("keeps a bounded query without trimming searchable spaces", () => {
    const query = `${"a".repeat(EDITOR_SEARCH_QUERY_LIMIT)}😀ignored`

    expect(normalizeEditorSearchQuery(query)).toBe(
      `${"a".repeat(EDITOR_SEARCH_QUERY_LIMIT)}`,
    )
    expect(normalizeEditorSearchQuery("  ")).toBe("  ")
    expect(normalizeEditorSearchQuery("")).toBe("")
  })

  test("finds case-insensitive overlapping matches in document order", () => {
    expect(
      findEditorSearchMatches(
        [
          { key: "first", text: "Banana" },
          { key: "second", text: "ANA" },
        ],
        "ana",
      ),
    ).toEqual({
      matches: [
        { key: "first", start: 1, end: 4 },
        { key: "first", start: 3, end: 6 },
        { key: "second", start: 0, end: 3 },
      ],
      hasMore: false,
    })
  })

  test("does not join separate text nodes into a synthetic match", () => {
    expect(
      findEditorSearchMatches(
        [
          { key: "left", text: "a" },
          { key: "right", text: "b" },
        ],
        "ab",
      ),
    ).toEqual({ matches: [], hasMore: false })
  })

  test("maps Unicode case-fold matches back to original UTF-16 offsets", () => {
    expect(
      findEditorSearchMatches([{ key: "unicode", text: "İ😀É" }], "i\u0307"),
    ).toEqual({
      matches: [{ key: "unicode", start: 0, end: 1 }],
      hasMore: false,
    })
    expect(
      findEditorSearchMatches([{ key: "unicode", text: "İ😀É" }], "é"),
    ).toEqual({
      matches: [{ key: "unicode", start: 3, end: 4 }],
      hasMore: false,
    })
    expect(
      findEditorSearchMatches([{ key: "unicode", text: "A😀B" }], "😀"),
    ).toEqual({
      matches: [{ key: "unicode", start: 1, end: 3 }],
      hasMore: false,
    })
  })

  test("caps returned matches and reports truncation", () => {
    const result = findEditorSearchMatches(
      [{ key: "many", text: "x ".repeat(EDITOR_SEARCH_RESULT_LIMIT + 1) }],
      "x",
    )

    expect(result.matches).toHaveLength(EDITOR_SEARCH_RESULT_LIMIT)
    expect(result.hasMore).toBe(true)
  })

  test("does not report truncation at the exact result limit", () => {
    const result = findEditorSearchMatches(
      [{ key: "many", text: "x ".repeat(EDITOR_SEARCH_RESULT_LIMIT) }],
      "x",
    )

    expect(result.matches).toHaveLength(EDITOR_SEARCH_RESULT_LIMIT)
    expect(result.hasMore).toBe(false)
  })

  test("returns no matches for an empty query", () => {
    expect(
      findEditorSearchMatches([{ key: "text", text: "search me" }], ""),
    ).toEqual({ matches: [], hasMore: false })
  })
})
