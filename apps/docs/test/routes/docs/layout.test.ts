import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/layout.tsx", import.meta.url),
  "utf8",
)

test("layout guide covers component choices and native semantics", () => {
  for (const [slug, name] of [
    ["box", "Box"],
    ["flex", "Flex"],
    ["stack", "Stack"],
    ["hstack", "HStack"],
    ["vstack", "VStack"],
    ["grid", "Grid"],
    ["center", "Center"],
    ["link", "Link"],
    ["paragraph", "Paragraph"],
    ["heading", "Heading"],
  ])
    expect(source).toMatch(new RegExp(`"${slug}"\\s*,\\s*"${name}"`))
  expect(source).toContain("/components/${slug}")
  expect(source).toContain('id="semantics"')
  expect(source).toContain('href="/docs/style-props"')
})
