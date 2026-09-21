import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-vstack-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("VStack example demonstrates vertical centered content", () => {
  expect(source).toContain("<VStack>")
  expect(source).toContain("Account ready")
  expect(source).toContain("Nothing else is needed.")
})
