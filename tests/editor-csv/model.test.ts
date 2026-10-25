import { parseEditorCsv } from "@editor/csv-model"
import { expect, test } from "bun:test"

test("CSV preserves escaped quotes, quoted delimiters, empty fields, BOM, and native newlines", () => {
  expect(
    parseEditorCsv(
      '\uFEFFName,Note,Empty\r\n"Ada, A.","Said ""yes""\r\nNext",\r\n',
    ),
  ).toEqual({
    ok: true,
    rows: [
      ["Name", "Note", "Empty"],
      ["Ada, A.", 'Said "yes"\r\nNext', ""],
    ],
  })
  expect(parseEditorCsv("a,b,\nc,d,")).toEqual({
    ok: true,
    rows: [
      ["a", "b", ""],
      ["c", "d", ""],
    ],
  })
  expect(parseEditorCsv('""')).toEqual({ ok: true, rows: [[""]] })
  expect(parseEditorCsv("😀,é\nb,c")).toEqual({
    ok: true,
    rows: [
      ["😀", "é"],
      ["b", "c"],
    ],
  })
  expect(parseEditorCsv('"=1+1","<script>"')).toEqual({
    ok: true,
    rows: [["=1+1", "<script>"]],
  })
})

test("malformed and nonrectangular CSV fails closed", () => {
  for (const text of [
    '"unclosed',
    'ab"c,d',
    '"a"trailing,b',
    "a,b\nc",
    "a,b\nc,d,e",
    "\uD800,x\nb,c",
    "\0,a\nb,c",
  ])
    expect(parseEditorCsv(text).ok).toBe(false)
  expect(parseEditorCsv("")).toEqual({ ok: false, reason: "empty" })
})

test("CSV enforces independent UTF-8, row, column, and logical cell bounds", () => {
  const edge = Array.from({ length: 50 }, () =>
    Array.from({ length: 50 }, () => "x").join(","),
  ).join("\n")

  const parsed = parseEditorCsv(edge)
  expect(parsed.ok).toBe(true)

  if (parsed.ok) {
    expect(parsed.rows.length).toBe(50)
    expect(parsed.rows[0]?.length).toBe(50)
  }

  for (const text of [
    edge + "\n" + Array.from({ length: 50 }, () => "x").join(","),
    Array.from({ length: 51 }, () => "x").join(","),
    "x".repeat(1048577),
    "😀".repeat(262145),
  ])
    expect(parseEditorCsv(text)).toEqual({ ok: false, reason: "limit" })
})
