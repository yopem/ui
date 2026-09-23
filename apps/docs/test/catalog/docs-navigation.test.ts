import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/docs-navigation.tsx", import.meta.url),
  "utf8",
)

test("navigation makes layout and style props discoverable", () => {
  expect(source).not.toContain('url: "/docs/primitives"')
  expect(source).toContain('name: "Layout and typography", url: "/docs/layout"')
  expect(source).toContain('name: "Style props", url: "/docs/style-props"')
  expect(source).toContain('name: "Lint rules", url: "/docs/lint"')
  expect(source).toContain('name: "Learn"')
})
