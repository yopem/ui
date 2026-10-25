export type EditorCsvFailure = "empty" | "syntax" | "shape" | "limit"

export type EditorCsvParseResult =
  | { readonly ok: true; readonly rows: readonly (readonly string[])[] }
  | { readonly ok: false; readonly reason: EditorCsvFailure }

const maxBytes = 1048576

const maxRows = 50

const maxColumns = 50

const maxCells = 2500

const encoder = new TextEncoder()

export function parseEditorCsv(source: string): EditorCsvParseResult {
  if (!source) return { ok: false, reason: "empty" }

  if (source.length > maxBytes) return { ok: false, reason: "limit" }

  if (/[\uD800-\uDFFF]/u.test(source) || source.includes("\0"))
    return { ok: false, reason: "syntax" }

  if (encoder.encode(source).byteLength > maxBytes)
    return { ok: false, reason: "limit" }
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source

  if (!text) return { ok: false, reason: "empty" }
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  let closed = false

  for (let index = 0; index < text.length; index++) {
    const character = text[index]

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index++
        } else {
          quoted = false
          closed = true
        }
      } else field += character
      continue
    }

    if (character === '"') {
      if (closed || field.length !== 0) return { ok: false, reason: "syntax" }
      quoted = true
      continue
    }

    if (character === "," || character === "\n" || character === "\r") {
      row.push(field)

      if (row.length > maxColumns) return { ok: false, reason: "limit" }
      field = ""
      closed = false

      if (character !== ",") {
        if (rows.length >= maxRows) return { ok: false, reason: "limit" }
        rows.push(row)
        row = []

        if (character === "\r" && text[index + 1] === "\n") index++
      }

      continue
    }

    if (closed) return { ok: false, reason: "syntax" }
    field += character
  }

  if (quoted) return { ok: false, reason: "syntax" }

  if (closed || field.length > 0 || row.length > 0) {
    row.push(field)

    if (row.length > maxColumns || rows.length >= maxRows)
      return { ok: false, reason: "limit" }
    rows.push(row)
  }

  if (rows.length === 0) return { ok: false, reason: "empty" }
  const first = rows.at(0)

  if (!first) return { ok: false, reason: "empty" }
  const columns = first.length

  if (rows.length * columns > maxCells) return { ok: false, reason: "limit" }

  if (rows.some((values) => values.length !== columns))
    return { ok: false, reason: "shape" }

  return { ok: true, rows }
}
