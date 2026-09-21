import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-flex-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Flex example demonstrates alignment and gap", () => {
  expect(source).toContain('<Flex alignItems="center" gap={4}>')
  expect(source.match(/<Box as="span">/g)).toHaveLength(2)
})
