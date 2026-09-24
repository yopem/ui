import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../../src/routes/docs/layout.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../../src/content/layout.mdx", import.meta.url),
  "utf8",
)

test("layout guide renders MDX with component choices and native semantics", () => {
  expect(route).toContain('createFileRoute("/docs/layout")')
  expect(route).toContain("source={layoutSource}")
  expect(route).toContain("Content={LayoutContent}")
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
  ]) {
    expect(content).toContain(`[${name}](/components/${slug})`)
  }
  expect(content).toContain("## Native semantics")
  expect(content).toContain("[Learn style props](/docs/style-props)")
  expect(content).toContain('<span id="components" />')
  expect(content).toContain('<Box as="article" p={4}>')
})
