import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/routes/index.tsx", import.meta.url),
  "utf8",
)

test("introduction offers a direct path to layout guidance", () => {
  expect(source).toContain('to="/docs/layout"')
  expect(source).toContain('to="/docs/style-props"')
  expect(source).toContain("Use shared style props on layout, controls")
})
