import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-hstack-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("HStack example keeps horizontal content in native children", () => {
  expect(source).toContain("<HStack>")
  expect(source).toContain("Inbox")
  expect(source).toContain("unread messages")
})
