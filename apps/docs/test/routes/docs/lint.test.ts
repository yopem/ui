import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/lint.tsx", import.meta.url),
  "utf8",
)

test("lint guide explains opt-in configuration and exceptions", () => {
  expect(source).toContain('title=".oxlintrc.json"')
  for (const rule of [
    "enforce-styling-methods",
    "no-leaked-dom-style-props",
    "no-unsupported-style-props",
    "prefer-ui-primitives",
    "static-stylex",
    "valid-polymorphic-as",
  ])
    expect(source).toContain(`"yopem-ui/${rule}": "error"`)
  expect(source).toContain("allowElements")
  expect(source).toContain("does not autofix")
  expect(source).toContain('href="/docs/layout"')
})
