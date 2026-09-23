import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/global-search.tsx", import.meta.url),
  "utf8",
)

test("compact mobile search keeps an accessible name", () => {
  expect(source).toContain('aria-label="Search documentation"')
  expect(source).toContain('"@media (max-width: 639px)": "2.5rem"')
  expect(source).toContain("styles.triggerText")
})
