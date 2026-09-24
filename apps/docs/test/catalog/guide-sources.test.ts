import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

test("machine-readable guides load the same MDX source as pages", () => {
  const source = readFileSync(
    new URL("../../src/catalog/guide-sources.ts", import.meta.url),
    "utf8",
  )
  expect(source).toContain("../content/*.mdx")
  expect(source).toContain("../content/${slug}.mdx")
})
