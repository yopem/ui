import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../src/routes/index.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../src/content/introduction.mdx", import.meta.url),
  "utf8",
)

test("introduction offers a direct path to layout guidance", () => {
  expect(route).toContain("Content={IntroductionContent}")
  expect(content).toContain("/docs/layout")
  expect(content).toContain("/docs/style-props")
  expect(content).toContain("Use shared style props on layout,\n  controls")
})
