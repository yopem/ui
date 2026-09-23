import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/style-props.tsx", import.meta.url),
  "utf8",
)

test("style props guide covers shared component styling and responsive states", () => {
  expect(source).toContain("across the registry")
  expect(source).toContain("Button and Input")
  expect(source).toContain("<Button p={3}>")
  expect(source).toContain("<Input aria-label=")
  expect(source).toContain('title="Everyday style props"')
  expect(source).toContain('title="Interaction states"')
  expect(source).toContain('import { Link } from "@/components/ui/link"')
  expect(source).not.toContain('<Box\n      as="a"')
  expect(source).toContain('id="responsive"')
  expect(source).toContain('id="advanced"')
  for (const api of [
    "BoxElement",
    "HeadingTag",
    "StyleProps",
    "StyleObject",
    "ResponsiveValue",
    "StyleComponentProps",
    "mergeStyleProps",
  ])
    expect(source).toContain(api)
  expect(source).toContain("build plugin")
  expect(source).toContain("build time")
})
