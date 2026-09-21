import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-grid-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Grid example demonstrates explicit tracks and gap", () => {
  expect(source).toContain('gridTemplateColumns="repeat(2, minmax(0, 1fr))"')
  expect(source).toContain("gap={4}")
})
