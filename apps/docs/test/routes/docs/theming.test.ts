import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../../src/routes/docs/theming.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../../src/content/theming.mdx", import.meta.url),
  "utf8",
)

test("theming keeps live source files while documenting token overrides", () => {
  expect(route).toContain('getDocumentation({ data: "theme" })')
  expect(route).toContain("components={{ ThemeFiles }}")
  expect(content).toContain("<ThemeFiles />")
  expect(content).toContain("src/styles/tokens.stylex.ts")
  expect(content).toContain("ThemeProvider")
  expect(content).toContain('<span id="dark-mode" />')
})
