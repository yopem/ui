import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("style-props guide retains live alias reference and responsive examples", () => {
  const content = readFileSync(
    new URL("../../src/content/style-props.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("<StylingAliases />")
  expect(content).toContain("<StylingConditions />")
  expect(content).toContain("```tsx")
  expect(guideToc(content).map((item) => item.url)).toContain(
    "#responsive-and-state-styles",
  )
})
