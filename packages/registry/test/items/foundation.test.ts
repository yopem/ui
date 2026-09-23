import { foundationItems } from "@registry/items/foundation"
import { rewriteImports, sourceFilePath } from "@registry/source-files"
import { expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../../src")

test("base distributes TypeScript style-props compilers and types", () => {
  const base = foundationItems.find((item) => item.name === "base")!
  const paths = base.files.map((file) => file.path)
  const modules = readdirSync(resolve(root, "lib")).filter((name) =>
    name.startsWith("style-props"),
  )
  expect(modules.length).toBeGreaterThan(0)
  for (const name of [
    ...modules,
    "style-props-babel.ts",
    "style-props-unplugin.ts",
  ]) {
    expect(paths).toContain(`lib/${name}`)
    const file = base.files.find((entry) => entry.path === `lib/${name}`)!
    expect(file.target).toBe(`@/lib/${name}`)
    expect(file.type).toBe("registry:lib")
    const source = rewriteImports(
      readFileSync(sourceFilePath(file.path), "utf8"),
    )
    expect(source).not.toContain("@registry/")
    expect(source).not.toContain("@yopem-ui/registry")
    for (const [, dependency] of source.matchAll(/from "\.\/(style[^"]+)"/g)) {
      expect(paths, `${name} -> ${dependency}`).toContain(
        `lib/${dependency.endsWith(".ts") ? dependency : `${dependency}.ts`}`,
      )
    }
  }
})

test("base delivers compiler without runtime style-props CSS tables", () => {
  const base = foundationItems.find((item) => item.name === "base")!
  expect(base.files.map((file) => file.path)).not.toContain(
    "lib/style-props-generate.ts",
  )
  expect(base.devDependencies).not.toContain("@babel/core@^7.29.7")
  expect(base.devDependencies).toContain("typescript-api@npm:typescript@6.0.2")
  expect(base.devDependencies).toContain("unplugin@^2.3.11")
  expect(base.docs?.api).toEqual(
    expect.arrayContaining([
      "StyleProps",
      "StyleObject",
      "ResponsiveValue",
      "StyleComponentProps",
      "Condition",
      "breakpoints",
    ]),
  )
})
