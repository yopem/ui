import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-calendar-24.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("selected prices keep selected contrast before good-price styling", () => {
  expect(source).toMatch(
    /modifiers\.selected\s*\?\s*exampleStyles\.selectedPrice\s*:\s*isGoodPrice/,
  )
  expect(source).toContain('goodPrice: { color: "var(--success-foreground)" }')
  expect(source).toContain(
    'selectedPrice: { color: "var(--primary-foreground)" }',
  )
})
