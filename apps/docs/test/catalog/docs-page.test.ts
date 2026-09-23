import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/docs-page.tsx", import.meta.url),
  "utf8",
)

test("reading width stays narrow without constraining full catalog pages", () => {
  expect(source).toContain('maxInlineSize: "52rem"')
  expect(source).toContain('fullArticle: { maxInlineSize: "none" }')
  expect(source).toContain('"@media (min-width: 1500px)"')
})
