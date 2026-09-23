import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/primitives.tsx", import.meta.url),
  "utf8",
)

test("primitive guide covers every component and links its reference", () => {
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
  for (const api of [
    "BoxElement",
    "HeadingTag",
    "StyleProps",
    "StyleObject",
    "ResponsiveValue",
    "StyleComponentProps",
    "splitStyleProps",
    "resolveStyleProps",
    "mergeStyleProps",
    "allowElements",
    "yopem-ui/prefer-ui-primitives",
  ])
    expect(source).toContain(api)
  expect(source).toContain("unset")
  expect(source).toContain('title="Everyday style props"')
  expect(source).toContain("Spacing:")
  expect(source).toContain("Sizing:")
  expect(source).toContain('title="Interaction states"')
  expect(source).toContain('id="responsive"')
  expect(source).toContain('id="advanced"')
  expect(source).toContain("does not autofix")
  expect(source).not.toContain("<html.")
})
