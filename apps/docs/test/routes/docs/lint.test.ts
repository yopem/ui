import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../../src/routes/docs/lint.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../../src/content/lint.mdx", import.meta.url),
  "utf8",
)

test("lint guide explains opt-in configuration and exceptions", () => {
  expect(route).toContain("Content={LintContent}")
  expect(content).toContain(".oxlintrc.json")
  for (const rule of [
    "enforce-styling-methods",
    "no-leaked-dom-style-props",
    "no-unsupported-style-props",
    "prefer-ui-primitives",
    "static-stylex",
    "valid-polymorphic-as",
  ])
    expect(content).toContain(`"yopem-ui/${rule}": "error"`)
  expect(content).toContain("allowElements")
  expect(content).toContain("does not autofix")
  expect(content).toContain("/docs/layout")
})
