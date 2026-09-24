import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("theming guide preserves source file widget and dark-mode instructions", () => {
  const content = readFileSync(
    new URL("../../src/content/theming.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("<ThemeFiles />")
  expect(content).toContain("ThemeProvider")
  expect(guideToc(content).map((item) => item.url)).toContain("#add-dark-mode")
})
