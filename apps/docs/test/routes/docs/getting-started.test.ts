import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/getting-started.tsx", import.meta.url),
  "utf8",
)

test("getting started keeps both component installation paths", () => {
  expect(source).toContain("component source with the CLI or copy it manually")
  expect(source).toContain("Manual tab:")
  expect(source).toContain('to="/components/$name"')
})
