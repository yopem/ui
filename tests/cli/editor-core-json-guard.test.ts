import { editorItem } from "@registry/items/editor"
import { editorDocumentItem } from "@registry/items/editor-document"
import { editorReviewItem } from "@registry/items/editor-review"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

test("core registry owns the shared scanner and optional items depend on core", () => {
  const scanner = editorItem.files.find(
    (file) => file.target === "@/components/editor/json-duplicates.ts",
  )

  expect(scanner).toBeDefined()

  if (!scanner) throw new Error("Missing scanner")
  expect(resolveSourcePath(scanner.path)).toBe(
    resolve(
      import.meta.dirname,
      "../../packages/editor/src/json-duplicates.ts",
    ),
  )
  expect(
    editorItem.dependencies.some((dependency) =>
      dependency.startsWith("@lexical/clipboard@"),
    ),
  ).toBe(true)
  expect(editorReviewItem.registryDependencies).toContain("editor")
  expect(editorDocumentItem.registryDependencies).toContain("editor")
})
