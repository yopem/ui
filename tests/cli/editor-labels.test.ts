import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

test("labels publication keeps the native node and pure model in the copied closure", async () => {
  const item = sourceItems.find((entry) => entry.name === "editor-labels")

  if (!item) throw new Error("Missing editor-labels")

  const paths = new Set(
    [
      "labels.ts",
      "labels-model.ts",
      "labels-node.ts",
      "labels-extension.ts",
      "labels-controls.tsx",
      "labels-select.tsx",
    ].map((name) => `components/editor/${name}`),
  )

  expect(new Set(item.files.map((file) => file.path))).toEqual(paths)
  expect(item.registryDependencies).toEqual(
    expect.arrayContaining([
      "editor",
      "checkbox",
      "checkbox-group",
      "label",
      "combobox",
    ]),
  )

  const built = registryItemSchema.parse(
    await Bun.file(
      resolve(root, "packages/registry/dist/r/editor-labels.json"),
    ).json(),
  )

  expect(new Set(built.files.map((file) => file.path))).toEqual(paths)

  for (const file of item.files) {
    const source = rewriteImports(
      await Bun.file(resolveSourcePath(file.path)).text(),
      file.path,
    )

    expect(source).not.toMatch(/@registry\/|@workspace\/|@yopem-ui\//)
  }

  for (const [path, target] of [
    ["labels", "labels"],
    ["labels/model", "labels-model"],
    ["labels/node", "labels-node"],
  ]) {
    expect(
      rewriteImports(`import { value } from "@yopem-ui/editor/${path}"`),
    ).toBe(`import { value } from "@/components/editor/${target}"`)
  }
})
