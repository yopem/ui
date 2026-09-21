import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-heading-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Heading example shows default h2 and explicit levels", () => {
  expect(source).toContain('<Heading as="h1">')
  expect(source).toContain("<Heading>Section title</Heading>")
  expect(source).toContain('<Heading as="h3">')
})
