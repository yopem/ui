import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("introduction links to starter guide and has navigable sections", () => {
  const content = readFileSync(
    new URL("../../src/content/introduction.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("/docs/getting-started")
  expect(guideToc(content).map((item) => item.url)).toContain(
    "#why-source-owned",
  )
})
