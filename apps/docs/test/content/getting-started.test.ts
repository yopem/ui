import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("getting started documents setup, copy and use steps", () => {
  const content = readFileSync(
    new URL("../../src/content/getting-started.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("/docs/installation")
  expect(content).toContain("```tsx")
  expect(guideToc(content)).toHaveLength(6)
})
