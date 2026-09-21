import { expect } from "bun:test"
import { readFileSync } from "node:fs"

export function expectCanonicalReexport(
  sourceUrl: URL,
  sourceModule: string,
  name: string,
) {
  const source = readFileSync(sourceUrl, "utf8").trim()

  expect(source, name).toBe(`export * from "${sourceModule}"`)
  expect(source).not.toContain("function")
  expect(source).not.toContain("const")
  expect(source).not.toContain("<")
}
