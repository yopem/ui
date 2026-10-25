import { sourceItems } from "@registry/items/index"
import { registryItemSchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "../..")

for (const [name, entry, helpers] of [
  [
    "editor-diagram",
    "diagram.ts",
    ["diagram-presentation.ts", "diagram-html.ts", "code-selection.ts"],
  ],
  [
    "editor-diagram-mermaid",
    "diagram-renderers/mermaid.browser.ts",
    ["diagram-renderers/source-policy.ts"],
  ],
  [
    "editor-diagram-plantuml",
    "diagram-renderers/plantuml.browser.ts",
    [
      "diagram-renderers/source-policy.ts",
      "diagram-renderers/plantuml-types.d.ts",
      "diagram-renderers/plantuml-types.js",
    ],
  ],
  ["editor-diagram-graphviz", "diagram-renderers/graphviz.ts", []],
  [
    "editor-diagram-flowchart",
    "diagram-renderers/flowchart.browser.ts",
    ["diagram-renderers/source-policy.ts"],
  ],
] as const) {
  test(`${name} publishes its entry and complete SDK helper closure`, async () => {
    const item = sourceItems.find((candidate) => candidate.name === name)

    if (!item) throw new Error(`Missing ${name}`)
    const paths = new Set(item.files.map((file) => file.path))
    expect(paths.has(`components/editor/${entry}`)).toBe(true)

    for (const helper of helpers)
      expect(paths.has(`components/editor/${helper}`)).toBe(true)

    const published = registryItemSchema.parse(
      await Bun.file(
        resolve(root, `packages/registry/dist/r/${name}.json`),
      ).json(),
    )

    expect(new Set(published.files.map((file) => file.path))).toEqual(paths)

    for (const dependency of item.dependencies) {
      expect(dependency).not.toContain("catalog:")
      expect(dependency).toMatch(/@\^/u)
    }

    for (const file of item.files) {
      const source = rewriteImports(
        await Bun.file(resolveSourcePath(file.path)).text(),
        file.path,
      )

      expect(source).not.toMatch(/@registry\/|@workspace\/|@yopem-ui\//u)
    }

    if (name === "editor-diagram") {
      expect(
        item.dependencies.some((dependency) =>
          /mermaid|plantuml|wasm-graphviz|flowchart\.js/u.test(dependency),
        ),
      ).toBe(false)
    } else expect(item.registryDependencies).toContain("editor-diagram")
  })
}
