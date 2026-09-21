import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-center-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Center example demonstrates centered content", () => {
  expect(source).toContain('<Center minBlockSize="8rem">')
  expect(source).toContain("Centered content")
})
