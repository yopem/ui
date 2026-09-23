import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-radio-group-9.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("p-radio-group-9 keeps unselected controls readable", () => {
  expect(source).toContain('default: "var(--muted-foreground)"')
  expect(source).toContain('"[data-checked]": "var(--foreground)"')
})
