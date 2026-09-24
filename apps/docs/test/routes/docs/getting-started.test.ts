import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../../src/routes/docs/getting-started.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../../src/content/getting-started.mdx", import.meta.url),
  "utf8",
)

test("getting started keeps both component installation paths", () => {
  expect(route).toContain("Content={GettingStartedContent}")
  expect(content).toContain("bunx @yopem-ui/cli init")
  expect(content).toContain("component source with the CLI or copy it")
  expect(content).toContain("Manual tab:")
  expect(content).toContain("/components/button")
})
