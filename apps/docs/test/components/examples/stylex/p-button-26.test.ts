import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-button-26.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("star count keeps readable text in both themes", () => {
  expect(source).toContain('color: "var(--primary-foreground)"')
  expect(source).not.toContain("var(--primary-foreground) 60%, transparent")
})
