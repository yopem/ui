import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-link-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Link example uses native href navigation", () => {
  expect(source).toContain('<Link href="/components">')
  expect(source).not.toContain("html.")
})
