import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-paragraph-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Paragraph example keeps body copy semantic and constrained", () => {
  expect(source).toContain('<Paragraph maxInlineSize="60ch">')
  expect(source).toContain("native p element")
})
