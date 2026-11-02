import {
  checkText,
  checkTree,
  DocumentError,
  documentLimits,
} from "@editor/document/boundary"
import { scanDocumentJSON } from "@editor/json-duplicates"
import { createHeadlessEditor } from "@lexical/headless"
import {
  documentNodes,
  importDocument,
  parseDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

function scan(source: string) {
  checkText(source)
  let value: unknown

  try {
    value = JSON.parse(source)
  } catch {
    throw new DocumentError(["Invalid document JSON."])
  }

  checkTree(value)
  const result = scanDocumentJSON(source, documentLimits.depth)

  if (result === "duplicate")
    throw new DocumentError(["Duplicate document JSON key."])

  if (result === "depth")
    throw new DocumentError(["Document exceeds depth limit."])

  return value
}

function expectError(source: string, message: string) {
  try {
    scan(source)
    throw new Error("Expected rejection.")
  } catch (error) {
    if (!(error instanceof DocumentError)) throw error
    expect(error.diagnostics).toEqual([message])
    expect(error.message).toBe(message)
  }
}

test("rejects decoded duplicate keys within each object", () => {
  for (const source of [
    '{"a":1,"a":2}',
    '{"":1,"":2,"":3}',
    '{"a":null,"a":false}',
    '{"outer":[0,{"x":1,"x":2}]}',
    '{"note":1,"n\\u006fte":2}',
    '{"\\u0024slots":1,"$slots":2}',
    '{"a\\\"b":1,"a\\u0022b":2}',
    '{"a\\\\b":1,"a\\u005cb":2}',
    '{"é":1,"\\u00e9":2}',
    '{"😀":1,"\\ud83d\\ude00":2}',
    '{"\\ud800":1,"\\uD800":2}',
    '{"x" \t\n\r :1,"x":2}',
  ])
    expectError(source, "Duplicate document JSON key.")
})

test("keeps values and separate object scopes without normalization", () => {
  for (const source of [
    "null",
    "true",
    "false",
    '"text"',
    "0",
    "-12.5e+3",
    "1e400",
    '{"é":1,"e\\u0301":2,"A":3,"a":4,"x":5,"x ":6}',
    '[{"a":1},{"a":2},[null,true,false,1,"{:[]}"]]',
    '{"a":{"x":1},"b":{"x":2}}',
    '{"quoted\\\"key":"escaped \\\" quote :{}[]", "slash\\\\key":"\\\\u0061", "v":"{\\\"a\\\":1}"}',
  ])
    expect(scan(source)).toEqual(JSON.parse(source))
})

test("syntax and unsafe keys retain their existing diagnostics", () => {
  for (const source of [
    '{"a":1,"a":2,}',
    '{"a":1,"a":"',
    '{"x\\q":1}',
    '{"x\\u00zz":1}',
    '{"a":01}',
    '{"a":1} trailing',
    "/*x*/{}",
    "\ufeff{}",
    '{"a"\u00a0:1}',
  ])
    expectError(source, "Invalid document JSON.")

  for (const source of [
    '{"__proto__":{"polluted":true}}',
    '{"\\u005f_proto__":1}',
    '{"nested":[{"constructor":1}]}',
    '{"prototype":1}',
  ])
    expectError(source, "Unsafe document key.")
  expect(
    scanDocumentJSON('{"__proto__":1,"__proto__":2}', documentLimits.depth),
  ).toBe("duplicate")
  expect(Object.prototype).not.toHaveProperty("polluted")
})

test("preserves byte, depth and structure budgets", () => {
  const exact = `"${"x".repeat(documentLimits.bytes - 2)}"`
  expect(new TextEncoder().encode(exact).length).toBe(documentLimits.bytes)
  expect(scan(exact)).toBe("x".repeat(documentLimits.bytes - 2))
  expectError(`${exact} `, "Document exceeds 1 MiB.")
  const multibyte = `"${"é".repeat((documentLimits.bytes - 2) / 2)}"`
  expect(new TextEncoder().encode(multibyte).length).toBe(documentLimits.bytes)
  expect(scan(multibyte)).toBe(JSON.parse(multibyte))
  expectError(multibyte.replace('"', '"é'), "Document exceeds 1 MiB.")
  const nested = (count: number) => "[".repeat(count) + "0" + "]".repeat(count)
  expect(scan(nested(65))).toEqual(JSON.parse(nested(65)))
  expectError(nested(66), "Document exceeds depth limit.")
  expectError(`{"x":${nested(65)},"x":0}`, "Document exceeds depth limit.")
  expectError(
    `[${Array.from({ length: documentLimits.nodes }, () => "{}").join(",")}]`,
    "Document exceeds structure budget.",
  )
})

test("handles wide objects, long keys and escape-heavy values", () => {
  const keys = Array.from(
    { length: 20000 },
    (_, index) => `"k${index}":0`,
  ).join(",")

  expect(scan(`{${keys}}`)).toEqual(JSON.parse(`{${keys}}`))
  expectError(`{${keys},"k19999":1}`, "Duplicate document JSON key.")
  const longKey = "\\u0061".repeat(10000)
  expectError(
    `{"${longKey}":0,"${"a".repeat(10000)}":1}`,
    "Duplicate document JSON key.",
  )
  const value = JSON.stringify('\\"{}[]:'.repeat(50000))
  expect(scan(`{"value":${value}}`)).toEqual(JSON.parse(`{"value":${value}}`))
})

test("duplicate document fields reject before replacing state", () => {
  const editor = createHeadlessEditor({
    namespace: "document-duplicates",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })

  importDocument(editor, "Keep existing", "markdown")
  const before = editor.getEditorState()
  const valid = JSON.stringify(before.toJSON())

  for (const source of [
    valid.replace('"root":', '"root":{"nested":[{"x":1,"x":2}]},"root":'),
    valid.replace('"root":', '"root":null,"root":'),
    valid.replace('"type":"root"', '"type":"root","t\\u0079pe":"root"'),
    valid.replace(
      '"type":"paragraph"',
      '"type":"paragraph","type":"paragraph"',
    ),
    valid.replace(
      '"text":"Keep existing"',
      '"text":"Keep existing","text":"Keep existing"',
    ),
    valid.replace('"root":{', '"root":{"$slots":{"note":{},"n\\u006fte":{}},'),
  ]) {
    const saved = source

    expect(() => parseDocument(source, "json")).toThrow(
      "Duplicate document JSON key.",
    )
    expect(() => importDocument(editor, source, "json")).toThrow(
      "Duplicate document JSON key.",
    )
    expect(editor.getEditorState()).toBe(before)
    expect(source).toBe(saved)
  }

  expect(parseDocument(valid, "json")).toEqual(before.toJSON())
})
