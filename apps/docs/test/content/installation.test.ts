import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { guideToc } from "@/catalog/guide-toc"

test("installation keeps interactive methods and framework instructions", () => {
  const content = readFileSync(
    new URL("../../src/content/installation.mdx", import.meta.url),
    "utf8",
  )
  expect(content).toContain("<InstallationMethods />")
  expect(content).toContain("### TanStack Start")
  expect(content).toContain("```tsx")
  expect(guideToc(content).find((item) => item.url === "#astro")?.depth).toBe(3)
})
