import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

for (const feature of ["columns", "date"] as const) {
  test(`${feature} publication copies complete optional source with explicit versions`, async () => {
    const item = sourceItems.find((entry) => entry.name === `editor-${feature}`)

    if (!item) throw new Error(`Missing editor-${feature}`)
    expect(item.registryDependencies).toContain("editor")

    for (const dependency of item.dependencies) {
      expect(dependency).not.toContain("catalog:")
      expect(dependency).toMatch(/@\^/)
    }

    const paths = new Set(item.files.map((file) => file.path))

    for (const suffix of [
      ".ts",
      "-model.ts",
      "-extension.ts",
      "-controls.tsx",
      feature === "date" ? "-node.tsx" : "-node.ts",
    ])
      expect(paths.has(`components/editor/${feature}${suffix}`)).toBe(true)

    const published = registryItemSchema.parse(
      await Bun.file(
        resolve(root, `packages/registry/dist/r/editor-${feature}.json`),
      ).json(),
    )

    expect(published.files.map((file) => file.path).sort()).toEqual(
      [...paths].sort(),
    )

    for (const file of item.files) {
      const content = rewriteImports(
        await Bun.file(resolveSourcePath(file.path)).text(),
        file.path,
      )

      expect(content).not.toMatch(/@registry\/|@workspace\/|@yopem-ui\//)
    }

    expect(
      rewriteImports(
        `import { value } from "@yopem-ui/editor/${feature}/model"`,
      ),
    ).toBe(`import { value } from "@/components/editor/${feature}-model"`)
    expect(
      rewriteImports(`import { value } from "@yopem-ui/editor/${feature}"`),
    ).toBe(`import { value } from "@/components/editor/${feature}"`)
  })
}

test("columns and date use actual house controls", () => {
  const columns = sourceItems.find((item) => item.name === "editor-columns")
  const date = sourceItems.find((item) => item.name === "editor-date")
  expect(columns?.registryDependencies).toEqual(
    expect.arrayContaining(["slider", "toolbar", "wrap"]),
  )
  expect(date?.registryDependencies).toEqual(
    expect.arrayContaining(["calendar", "popover"]),
  )
})
