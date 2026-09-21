import { foundationItems } from "@registry/items/foundation"
import { rewriteImports } from "@registry/source-files"
import { expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../../src")

test("base distributes every runtime style-props module with consumer-safe imports", () => {
  const base = foundationItems.find((item) => item.name === "base")!
  const paths = base.files.map((file) => file.path)
  const modules = readdirSync(resolve(root, "lib")).filter(
    (name) =>
      name.startsWith("style-props") && name !== "style-props-generate.ts",
  )
  expect(modules.length).toBeGreaterThan(0)
  for (const name of modules) {
    expect(paths).toContain(`lib/${name}`)
    const file = base.files.find((entry) => entry.path === `lib/${name}`)!
    expect(file.target).toBe(`@/lib/${name}`)
    expect(file.type).toBe("registry:lib")
    const source = rewriteImports(
      readFileSync(resolve(root, file.path), "utf8"),
    )
    expect(source).not.toContain("@registry/")
    for (const [, dependency] of source.matchAll(/from "\.\/(style[^"]+)"/g)) {
      expect(paths, `${name} -> ${dependency}`).toContain(
        `lib/${dependency}.ts`,
      )
    }
  }
})

test("base delivers style-props API without development generator or compiler", () => {
  const base = foundationItems.find((item) => item.name === "base")!
  expect(base.files.map((file) => file.path)).not.toContain(
    "lib/style-props-generate.ts",
  )
  expect(base.devDependencies).toEqual([])
  expect(base.dependencies.some((name) => name.startsWith("typescript"))).toBe(
    false,
  )
  expect(base.docs?.api).toEqual(
    expect.arrayContaining([
      "StyleProps",
      "StyleObject",
      "ResponsiveValue",
      "splitStyleProps",
      "resolveStyleProps",
      "Condition",
      "breakpoints",
      "propertyStyles",
    ]),
  )
})
