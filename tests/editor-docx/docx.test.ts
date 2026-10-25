import { createDocumentEditor } from "@editor/document/convert"
import { exportDocx, importDocx, parseDocx } from "@editor/docx"
import {
  readZipArchive,
  writeZipArchive,
  type ZipWriteEntry,
} from "@editor/docx-zip"
import { createHeadlessEditor } from "@lexical/headless"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import {
  documentNodes,
  DocumentError,
  exportDocument,
  importDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  UNDO_COMMAND,
} from "lexical"

const sample =
  '<h2>DOCX report</h2><p><strong>Bold</strong>, <em>italic</em>, <u>underlined</u>, <del>removed</del>, <span style="color: #123456; font-size: 18px">styled text</span>, and <a href="https://example.test/report">a safe link</a>.</p><ol start="3"><li>First</li><li>Second</li></ol><table><tr><th>Field</th><th>Value</th></tr><tr><td>State</td><td>Ready</td></tr></table>'

function editor() {
  return createDocumentEditor()
}

function zipFiles(
  files: ReadonlyMap<string, Uint8Array>,
  overrides: ReadonlyMap<string, { flags?: number; name?: string }> = new Map(),
) {
  return writeZipArchive(
    [...files].map(([name, data]) => ({
      name: overrides.get(name)?.name ?? name,
      data,
      flags: overrides.get(name)?.flags,
    })),
  )
}

function replacePart(
  source: Uint8Array,
  name: string,
  replace: (source: string) => string,
) {
  const files = readZipArchive(source)
  const current = files.get(name)

  if (!current) throw new Error(`Missing ${name}`)
  files.set(
    name,
    new TextEncoder().encode(replace(new TextDecoder().decode(current))),
  )

  return zipFiles(files)
}

async function rawDeflate(source: Uint8Array) {
  const stream = new Blob([Uint8Array.from(source)])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"))

  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function expectDocumentError(promise: Promise<unknown>) {
  const [result] = await Promise.allSettled([promise])

  expect(result.status).toBe("rejected")

  if (result.status === "rejected")
    expect(result.reason).toBeInstanceOf(DocumentError)
}

test("DOCX export writes OpenXML package parts and imports rich native content", async () => {
  const source = editor()
  importDocument(source, sample, "html")

  const bytes = exportDocx(source)
  const files = readZipArchive(bytes)
  const documentPart = files.get("word/document.xml")

  if (!documentPart) throw new Error("DOCX has no main document part")
  const documentXml = new TextDecoder().decode(documentPart)

  expect(bytes[0]).toBe(0x50)
  expect(bytes[1]).toBe(0x4b)
  expect(files.has("[Content_Types].xml")).toBe(true)
  expect(files.has("_rels/.rels")).toBe(true)
  expect(documentXml).toContain("<w:document")
  expect(documentXml).toContain("<w:tbl>")
  expect(documentXml).not.toContain("<html")

  const target = editor()
  importDocument(target, "Original", "markdown")
  await importDocx(target, bytes)

  const html = exportDocument(target, "html")
  expect(html).toContain("DOCX report")
  expect(html).toContain("<strong>Bold</strong>")
  expect(html).toContain("styled text")
  expect(html).toContain('href="https://example.test/report"')
  expect(html).toContain('<ol start="3">')
  expect(html).toContain("<table>")
  expect(JSON.stringify(await parseDocx(bytes))).toContain("DOCX report")
})

test("DOCX import accepts bounded raw-DEFLATE ZIP entries", async () => {
  const source = editor()
  importDocument(source, sample, "html")
  const stored = exportDocx(source)
  const files = readZipArchive(stored)
  const entries: ZipWriteEntry[] = []

  for (const [name, data] of files) {
    entries.push({
      name,
      data,
      method: 8 as const,
      compressedData: await rawDeflate(data),
    })
  }

  const bytes = writeZipArchive(entries)

  expect(JSON.stringify(await parseDocx(bytes))).toContain("DOCX report")
})

test("ZIP paths, duplicate entries, encryption, entry counts, and inflation budgets fail closed", async () => {
  const source = editor()
  importDocument(source, sample, "html")
  const bytes = exportDocx(source)
  const files = readZipArchive(bytes)
  const first = files.entries().next().value

  if (!first) throw new Error("DOCX fixture has no package parts")
  const [firstName, firstBytes] = first
  const entries = [...files].map(([name, data]) => ({ name, data }))
  const oversized = new Uint8Array(1_048_577)

  const inflatedArchive = writeZipArchive([
    {
      name: "extra/bomb.bin",
      data: oversized,
      method: 8,
      compressedData: await rawDeflate(oversized),
    },
  ])

  for (const invalid of [
    zipFiles(files, new Map([[firstName, { name: "../escape.xml" }]])),
    writeZipArchive([...entries, { name: firstName, data: firstBytes }]),
    zipFiles(files, new Map([[firstName, { flags: 1 }]])),
    writeZipArchive([
      ...entries,
      ...Array.from({ length: 130 }, (_, index) => ({
        name: `extra/${index}.xml`,
        data: new Uint8Array(),
      })),
    ]),
    inflatedArchive,
    new Uint8Array(1_048_577),
  ])
    await expectDocumentError(parseDocx(invalid))
})

test.each([
  [
    "DTD declarations",
    (xml: string) =>
      xml.replace(
        "<w:document",
        '<!DOCTYPE w:document [<!ENTITY x "x">]><w:document',
      ),
  ],
  [
    "unsupported drawings",
    (xml: string) => xml.replace("</w:p>", "<w:drawing/></w:p>"),
  ],
])(
  "DOCX import rejects %s before document replacement",
  async (_name, replace) => {
    const source = editor()
    importDocument(source, sample, "html")

    const bytes = replacePart(exportDocx(source), "word/document.xml", replace)

    const target = editor()
    importDocument(target, "Original", "markdown")
    const before = target.getEditorState().toJSON()

    await expectDocumentError(importDocx(target, bytes))
    expect(target.getEditorState().toJSON()).toEqual(before)
  },
)

test("DOCX import rejects unsafe external relationships without fetching resources", async () => {
  const source = editor()
  importDocument(source, sample, "html")

  const bytes = replacePart(
    exportDocx(source),
    "word/_rels/document.xml.rels",
    (xml) => xml.replace("https://example.test/report", "file:///etc/passwd"),
  )

  await expectDocumentError(parseDocx(bytes))
})

test("DOCX import is atomic for cancellation, staleness, readonly state, and undo", async () => {
  const source = editor()
  importDocument(source, sample, "html")
  const bytes = exportDocx(source)
  const target = editor()
  const stop = registerHistory(target, createEmptyHistoryState(), 300)
  importDocument(target, "Original", "markdown")
  const controller = new AbortController()
  controller.abort()

  await expectDocumentError(
    importDocx(target, new Blob([Uint8Array.from(bytes)]), {
      signal: controller.signal,
    }),
  )
  expect(exportDocument(target, "markdown").trim()).toBe("Original")

  const pending = importDocx(target, new Blob([Uint8Array.from(bytes)]))
  target.update(() => {
    const root = $getRoot()
    root.clear()
    root.append($createParagraphNode().append($createTextNode("Live edit")))
  })
  await expectDocumentError(pending)
  expect(exportDocument(target, "markdown").trim()).toBe("Live edit")

  await importDocx(target, bytes)
  target.dispatchCommand(UNDO_COMMAND, undefined)
  expect(exportDocument(target, "markdown").trim()).toBe("Live edit")

  target.setEditable(false)
  const beforeReadonly = target.getEditorState().toJSON()
  await expectDocumentError(importDocx(target, bytes))
  expect(target.getEditorState().toJSON()).toEqual(beforeReadonly)
  stop()
})

test("unsupported native content cannot disappear during DOCX export", () => {
  const source = editor()
  importDocument(
    source,
    '<ul><li><input type="checkbox" checked>Task</li></ul>',
    "html",
  )

  expect(() => exportDocx(source)).toThrow(DocumentError)
})

test("missing target nodes do not receive partial DOCX state", async () => {
  const source = editor()
  importDocument(source, sample, "html")

  const target = createHeadlessEditor({
    namespace: "docx-missing-table",
    nodes: documentNodes.filter(
      (node) => !["table", "tablerow", "tablecell"].includes(node.getType()),
    ),
    onError(error) {
      throw error
    },
  })

  importDocument(target, "Original", "markdown")
  const before = target.getEditorState()

  await expectDocumentError(importDocx(target, exportDocx(source)))
  expect(target.getEditorState()).toBe(before)
  expect(exportDocument(target, "markdown").trim()).toBe("Original")
})
