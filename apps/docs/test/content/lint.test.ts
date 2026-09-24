import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("lint guide documents configuration and rule coverage", () => {
  const content = readFileSync(
    new URL("../../src/content/lint.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("```json")
  expect(content).toContain("yopem-ui/valid-polymorphic-as")
  expect(guideToc(content).map((item) => item.url)).toContain("#configuration")
})
