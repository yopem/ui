import {
  editorDocumentExportImageItem,
  editorDocumentExportItem,
} from "@registry/items/editor-document-export"
import { expect, test } from "bun:test"

test("document export publishes shared checksum and isolated optional capture", () => {
  const paths = editorDocumentExportItem.files.map((file) => file.path)

  expect(paths).toContain("components/editor/checksum.ts")
  expect(paths).toContain("components/editor/serial-iteration.ts")
  expect(paths).toContain("components/editor/document-export-model.ts")
  expect(paths).toContain("components/editor/document-export-image.ts")
  expect(paths).not.toContain(
    "components/editor/document-export-html-to-image.ts",
  )
  expect(
    editorDocumentExportItem.dependencies.some((dependency) =>
      dependency.startsWith("html-to-image@"),
    ),
  ).toBe(false)
  expect(editorDocumentExportImageItem.registryDependencies).toContain(
    "editor-document-export",
  )
  expect(
    editorDocumentExportImageItem.dependencies.some((dependency) =>
      dependency.startsWith("html-to-image@^"),
    ),
  ).toBe(true)

  for (const file of [
    ...editorDocumentExportItem.files,
    ...editorDocumentExportImageItem.files,
  ]) {
    expect(file.target).toBe(`@/${file.path}`)
  }
})
