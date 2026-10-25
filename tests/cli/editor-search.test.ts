import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("search publication keeps native search source and pure model separate", async () => {
  const item = sourceItems.find((entry) => entry.name === "editor-search")

  if (!item) throw new Error("Missing editor-search")
  expect(item.registryDependencies).toEqual(
    expect.arrayContaining(["editor", "box", "button", "input"]),
  )
  const paths = new Set(item.files.map((file) => file.path))
  expect(paths).toEqual(
    new Set([
      "components/editor/search.tsx",
      "components/editor/search-model.ts",
    ]),
  )

  for (const dependency of item.dependencies) {
    expect(dependency).not.toContain("catalog:")
    expect(dependency).toMatch(/@\^/)
  }

  const published = registryItemSchema.parse(
    await Bun.file(
      resolve(root, "packages/registry/dist/r/editor-search.json"),
    ).json(),
  )

  expect(new Set(published.files.map((file) => file.path))).toEqual(paths)

  for (const file of item.files) {
    const source = rewriteImports(
      await Bun.file(resolveSourcePath(file.path)).text(),
      file.path,
    )

    expect(source).not.toMatch(/@registry\/|@workspace\/|@yopem-ui\//)
  }

  expect(
    rewriteImports(
      'import { EditorSearchRoot } from "@yopem-ui/editor/search"',
    ),
  ).toBe('import { EditorSearchRoot } from "@/components/editor/search"')
  expect(
    rewriteImports(
      'import { findEditorSearchMatches } from "@yopem-ui/editor/search-model"',
    ),
  ).toBe(
    'import { findEditorSearchMatches } from "@/components/editor/search-model"',
  )
})
