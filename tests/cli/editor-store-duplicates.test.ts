import { mapTargetPath } from "@cli/install"
import { editorCollaborationServerItem } from "@registry/items/editor-collaboration-server"
import { editorStoreItem } from "@registry/items/editor-store"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { dirname, resolve } from "node:path"

test("scanner rewrite is scoped to store sources", () => {
  const source =
    'import { scanDocumentJSON } from "@yopem-ui/editor/json-duplicates"'

  expect(
    rewriteImports(source, "lib/editor-store/document-model.ts"),
  ).toContain('from "./json-duplicates"')

  for (const path of [
    "",
    "components/editor/document/index.ts",
    "lib/editor-store-other/file.ts",
  ]) {
    expect(rewriteImports(source, path)).toContain(
      'from "@/components/editor/json-duplicates"',
    )
  }
})

test("standalone store includes the shared scanner at each mapped lib location", async () => {
  const scanner = editorStoreItem.files.find(
    (file) => file.target === "@/lib/editor-store/json-duplicates.ts",
  )

  if (!scanner) throw new Error("Missing store scanner")
  expect(resolveSourcePath(scanner.path)).toBe(
    resolve(
      import.meta.dirname,
      "../../packages/editor/src/json-duplicates.ts",
    ),
  )
  expect(editorCollaborationServerItem.registryDependencies).toContain(
    "editor-store",
  )

  for (const lib of ["src/lib", "src/services"]) {
    const paths = {
      components: "src/components",
      ui: "src/components/ui",
      hooks: "src/hooks",
      lib,
      styles: "src/styles",
      theme: "src/themes",
    }

    const target = mapTargetPath(scanner.target, paths)

    for (const name of ["document-model.ts", "document-http.ts"]) {
      const file = editorStoreItem.files.find(
        (entry) => entry.target === `@/lib/editor-store/${name}`,
      )

      if (!file) throw new Error(`Missing ${name}`)

      const content = rewriteImports(
        await Bun.file(resolveSourcePath(file.path)).text(),
        file.path,
      )

      expect(content).toContain('from "./json-duplicates"')
      expect(
        resolve(
          dirname(mapTargetPath(file.target, paths)),
          "./json-duplicates.ts",
        ),
      ).toBe(resolve(target))
      expect(content).not.toContain("@/components/editor/json-duplicates")
    }
  }
})
