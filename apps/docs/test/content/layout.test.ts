import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("layout guide references primitives and semantic examples", () => {
  const content = readFileSync(
    new URL("../../src/content/layout.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("/components/box")
  expect(content).toContain("```tsx")
  expect(guideToc(content).map((item) => item.url)).toContain(
    "#native-semantics",
  )
})
