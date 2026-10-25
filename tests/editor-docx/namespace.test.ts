import { createDocumentEditor } from "@editor/document/convert"
import { exportDocx, importDocx } from "@editor/docx"
import { parseXml } from "@editor/docx-xml"
import { readZipArchive, writeZipArchive } from "@editor/docx-zip"
import { DocumentError, importDocument } from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

const wordNamespace =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

const packageRelationshipNamespace =
  "http://schemas.openxmlformats.org/package/2006/relationships"

function packageBytes() {
  const source = createDocumentEditor()
  importDocument(source, "<p>Namespace check</p>", "html")

  return exportDocx(source)
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
  const target = createDocumentEditor()
  importDocument(target, "Original", "markdown")
  const before = target.getEditorState().toJSON()

  const failure = await importDocx(target, source).catch(
    (cause: unknown) => cause,
  )

  expect(failure).toBeInstanceOf(DocumentError)
  expect(target.getEditorState().toJSON()).toEqual(before)
}

test("DOCX XML rejects rebound namespaces and expanded duplicate attributes", () => {
  expect(() =>
    parseXml(
      `<w:document xmlns:w="${wordNamespace}"><w:p xmlns:w="${packageRelationshipNamespace}"/></w:document>`,
    ),
  ).toThrow(DocumentError)

  expect(() =>
    parseXml(
      `<w:document xmlns:w="${wordNamespace}" xmlns:alias="${wordNamespace}" w:val="one" alias:val="two"/>`,
    ),
  ).toThrow(DocumentError)

  expect(() =>
    parseXml(
      `<w:document xmlns:w="${wordNamespace}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:r><w:t xml:space="preserve">Text</w:t></w:r></w:p></w:document>`,
    ),
  ).not.toThrow()
})

test("DOCX import rejects a foreign-namespace Relationship before mutation", async () => {
  const bytes = replacePart(
    packageBytes(),
    "word/_rels/document.xml.rels",
    (xml) =>
      xml.replace("<Relationship ", `<Relationship xmlns="${wordNamespace}" `),
  )

  await expectAtomicRejection(bytes)
})

test("DOCX import rejects a rebound Word prefix before mutation", async () => {
  const bytes = replacePart(packageBytes(), "word/document.xml", (xml) =>
    xml.replace("<w:p>", `<w:p xmlns:w="${packageRelationshipNamespace}">`),
  )

  await expectAtomicRejection(bytes)
})
