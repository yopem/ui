import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/docs-navigation.tsx", import.meta.url),
  "utf8",
)

test("navigation makes layout and style props discoverable", () => {
  expect(source.match(/url: "\/docs\/primitives"/g)).toHaveLength(1)
  expect(source).toContain('name: "Layout and style props"')
  expect(source).toContain('name: "Learn"')
})
