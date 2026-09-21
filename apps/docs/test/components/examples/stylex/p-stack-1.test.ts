import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-stack-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("Stack example demonstrates a vertical content group", () => {
  expect(source).toContain("<Stack>")
  expect(source).toContain("Project status")
  expect(source).toContain("All systems operational.")
})
