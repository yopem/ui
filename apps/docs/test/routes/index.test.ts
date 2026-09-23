import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/routes/index.tsx", import.meta.url),
  "utf8",
)

test("introduction offers a direct path to layout guidance", () => {
  expect(source).toContain('to="/docs/primitives"')
  expect(source).toContain("Choose layout components and learn style props")
})
