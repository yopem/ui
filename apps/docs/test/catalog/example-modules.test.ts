import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"

const source = readFileSync(
  new URL("../../src/catalog/example-modules.ts", import.meta.url),
  "utf8",
)

test("example loader accepts named fixtures and keeps legacy default exports", () => {
  const declaration = source.match(
    /export function resolveExampleModule[\s\S]*?\n}/,
  )?.[0]
  expect(declaration).toBeDefined()
  if (!declaration) throw new Error("Missing example module resolver")
  const code = new Bun.Transpiler({ loader: "ts" }).transformSync(declaration)
  const resolveModule: (module: { default?: string; Example?: string }) => {
    default: string
  } = runInNewContext(`${code.replace("export ", "")}\nresolveExampleModule`)
  expect(resolveModule({ default: "Legacy" }).default).toBe("Legacy")
  expect(resolveModule({ Example: "Named" }).default).toBe("Named")
  expect(source).toContain("load().then(resolveExampleModule)")
})
