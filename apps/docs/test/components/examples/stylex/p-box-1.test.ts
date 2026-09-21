import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-box-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Box example uses Box for semantic layout and style props", () => {
  expect(source).toContain('<Box as="section" p={4}>')
  expect(source).not.toContain("html.")
})
