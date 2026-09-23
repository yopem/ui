import { rewriteImports } from "@registry/source-files"
import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/docs.functions.ts", import.meta.url),
  "utf8",
)

test("documentation loads moved compiler files and rewrites copyable imports", () => {
  expect(source).toContain('"../../../../packages/compiler/src/*.ts"')
  expect(source).toContain("compilerSources[")
  expect(source).toContain("rewriteImports(await load())")
  expect(
    rewriteImports(
      'import { scopes } from "@yopem-ui/registry/lib/style-props-config"',
    ),
  ).toContain('from "./style-props-config.ts"')
})
