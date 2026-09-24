import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

test("search indexes guide prose from canonical MDX", () => {
  const source = readFileSync(
    new URL("../../../src/routes/api/search.ts", import.meta.url),
    "utf8",
  )
  expect(source).toContain("getGuideSource(page.url")
  expect(source).toContain('page.url === "/" ? "introduction"')
  expect(source).toContain("...guidePages.map")
})
