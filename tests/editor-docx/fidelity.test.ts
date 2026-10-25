import { createDocumentEditor } from "@editor/document/convert"
import { exportDocx, importDocx } from "@editor/docx"
import { readZipArchive, writeZipArchive } from "@editor/docx-zip"
import {
  DocumentError,
  exportDocument,
  importDocument,
} from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

function editor() {
  return createDocumentEditor()
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

  return writeZipArchive(
    [...files].map(([entryName, data]) => ({ name: entryName, data })),
  )
}

async function expectAtomicRejection(source: Uint8Array) {
  const target = editor()
  importDocument(target, "Original", "markdown")
  const before = target.getEditorState().toJSON()

  const failure = await importDocx(target, source).catch(
    (cause: unknown) => cause,
  )

  expect(failure).toBeInstanceOf(DocumentError)
  expect(target.getEditorState().toJSON()).toEqual(before)
}

function appendStyleContent(xml: string, styleId: string, content: string) {
  const start = xml.indexOf(
    `<w:style w:type="paragraph" w:styleId="${styleId}">`,
  )

  if (start < 0) throw new Error(`Missing ${styleId} style`)
  const end = xml.indexOf("</w:style>", start)

  if (end < 0) throw new Error(`Unclosed ${styleId} style`)

  return `${xml.slice(0, end)}${content}${xml.slice(end)}`
}

test("DOCX round-trip preserves table grid widths and alignment", async () => {
  const source = editor()
  importDocument(
    source,
    '<table align="center"><colgroup><col style="width: 120px"><col style="width: 180px"></colgroup><tbody><tr><td><p>First</p></td><td><p>Second</p></td></tr></tbody></table>',
    "html",
  )

  const target = editor()
  await importDocx(target, exportDocx(source))
  const html = exportDocument(target, "html")

  expect(html).toContain('align="center"')
  expect(html).toContain("width: 120px")
  expect(html).toContain("width: 180px")
})

test("DOCX import rejects unsupported and duplicate table properties atomically", async () => {
  const source = editor()
  importDocument(source, "<table><tr><td><p>Cell</p></td></tr></table>", "html")
  const bytes = exportDocx(source)

  const invalid = [
    replacePart(bytes, "word/document.xml", (xml) =>
      xml.replace("<w:tblPr>", '<w:tblPr><w:tblStyle w:val="TableGrid"/>'),
    ),
    replacePart(bytes, "word/document.xml", (xml) =>
      xml.replace("<w:tbl>", "<w:tbl><w:tblPr/>"),
    ),
    replacePart(bytes, "word/document.xml", (xml) =>
      xml.replace("<w:tblGrid>", "<w:tblGrid/><w:tblGrid>"),
    ),
    replacePart(bytes, "word/document.xml", (xml) =>
      xml.replace("</w:tblPr>", '<w:tblW w:w="0" w:type="auto"/></w:tblPr>'),
    ),
  ]

  for (const value of invalid) await expectAtomicRejection(value)
})

test("DOCX import rejects style formatting that has no native representation", async () => {
  const source = editor()
  importDocument(source, "<h1>Styled heading</h1>", "html")

  const bytes = replacePart(exportDocx(source), "word/styles.xml", (xml) =>
    appendStyleContent(
      xml,
      "Heading1",
      '<w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="FF0000"/></w:rPr>',
    ),
  )

  await expectAtomicRejection(bytes)
})

test("DOCX import rejects unsupported font families before mutation", async () => {
  const source = editor()
  importDocument(source, "<p>Font name</p>", "html")

  const bytes = replacePart(exportDocx(source), "word/document.xml", (xml) =>
    xml.replace(
      "<w:r><w:t>",
      '<w:r><w:rPr><w:rFonts w:ascii="Papyrus" w:hAnsi="Papyrus"/></w:rPr><w:t>',
    ),
  )

  await expectAtomicRejection(bytes)
})

test("DOCX link round-trip preserves title and target metadata", async () => {
  const source = editor()
  importDocument(
    source,
    '<p><a href="https://example.test/help" title="Help page" target="_blank">Help</a></p>',
    "html",
  )
  const target = editor()
  await importDocx(target, exportDocx(source))
  const html = exportDocument(target, "html")

  expect(html).toContain('href="https://example.test/help"')
  expect(html).toContain('title="Help page"')
  expect(html).toContain('target="_blank"')
})

test("DOCX export rejects link relations that Word cannot represent", () => {
  const source = editor()
  importDocument(
    source,
    '<p><a href="https://example.test/help" rel="nofollow">Help</a></p>',
    "html",
  )

  expect(() => exportDocx(source)).toThrow(DocumentError)
})
