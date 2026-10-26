import { editorDocxItem } from "@registry/items/editor-docx"
import { registryItemSchema } from "@registry/schema"
import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"

const files = [
  "checksum.ts",
  "docx.ts",
  "docx-controls.tsx",
  "docx-export.ts",
  "docx-import.ts",
  "docx-limits.ts",
  "docx-security.ts",
  "docx-xml.ts",
  "docx-zip.ts",
]

test("optional DOCX publication includes codecs, controls, and document dependencies", () => {
  expect(editorDocxItem.name).toBe("editor-docx")
  expect(editorDocxItem.registryDependencies).toContain("editor-document")
  expect(editorDocxItem.files.map((file) => file.path).sort()).toEqual(
    files.map((name) => `components/editor/${name}`).sort(),
  )

  for (const file of editorDocxItem.files) {
    expect(file.target).toBe(`@/${file.path}`)
  }

  for (const name of ["lexical", "zod", "@types/hast", "@base-ui/react"]) {
    expect(
      editorDocxItem.dependencies.some((dependency) =>
        dependency.startsWith(`${name}@^`),
      ),
    ).toBe(true)
  }
})

test("built optional DOCX registry keeps base editing independent", async () => {
  const item = registryItemSchema.parse(
    JSON.parse(
      await readFile(
        new URL(
          "../../packages/registry/dist/r/editor-docx.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  )

  const base = registryItemSchema.parse(
    JSON.parse(
      await readFile(
        new URL("../../packages/registry/dist/r/editor.json", import.meta.url),
        "utf8",
      ),
    ),
  )

  expect(item.files.map((file) => file.path).sort()).toEqual(
    files.map((name) => `components/editor/${name}`).sort(),
  )
  expect(base.registryDependencies).not.toContain("editor-docx")
  expect(
    base.files.some((file) => file.path.startsWith("components/editor/docx")),
  ).toBe(false)
})
