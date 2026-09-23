import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/table-of-contents.tsx", import.meta.url),
  "utf8",
)

test("contents rail appears only when reading column has room", () => {
  expect(source).toContain('"@media (min-width: 1500px)": "block"')
  expect(source).toContain('aria-label="On this page"')
})
