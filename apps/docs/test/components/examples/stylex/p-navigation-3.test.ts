import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-navigation-3.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("p-navigation-3 keeps inactive links readable", () => {
  expect(source).toContain('default: "var(--muted-foreground)"')
  expect(source).toContain('"[aria-current=page]": "var(--foreground)"')
})
