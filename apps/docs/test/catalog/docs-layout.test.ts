import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/docs-layout.tsx", import.meta.url),
  "utf8",
)

test("documentation shell keeps navigation separate from reading column", () => {
  expect(source).toContain('default: "16rem minmax(0, 1fr)"')
  expect(source).toContain('as="main"')
  expect(source).toContain('aria-label="Open navigation"')
})
