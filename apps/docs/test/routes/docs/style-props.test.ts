import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const route = readFileSync(
  new URL("../../../src/routes/docs/style-props.tsx", import.meta.url),
  "utf8",
)
const content = readFileSync(
  new URL("../../../src/content/style-props.mdx", import.meta.url),
  "utf8",
)

test("style props guide keeps examples, responsive states, and live references", () => {
  expect(route).toContain('createFileRoute("/docs/style-props")')
  expect(route).toContain("source={stylePropsSource}")
  expect(route).toContain("Content={StylePropsContent}")
  expect(route).toContain(
    "components={{ StylingAliases, StylingConditions, Breakpoints }}",
  )
  expect(route).toContain("Object.entries(breakpoints)")
  expect(route).toContain("Object.entries(aliases)")
  expect(route).toContain("...selectors, ...mediaConditions, ...scopes")
  expect(content).toContain("across the registry")
  expect(content).toContain("Button and Input")
  expect(content).toContain("<Button p={3}>")
  expect(content).toContain("<Input aria-label=")
  expect(content).toContain("### Everyday style props")
  expect(content).toContain("### Interaction states")
  expect(content).toContain('import { Link } from "@/components/ui/link"')
  expect(content).toContain("## Responsive and state styles")
  expect(content).toContain("## Advanced styling")
  expect(content).toContain("<StylingAliases />")
  expect(content).toContain("<StylingConditions />")
  expect(content).toContain("<Breakpoints />")
  for (const api of [
    "BoxElement",
    "HeadingTag",
    "StyleProps",
    "StyleObject",
    "ResponsiveValue",
    "StyleComponentProps",
    "mergeStyleProps",
  ])
    expect(content).toContain(api)
  expect(content).toContain("build plugin")
  expect(content).toContain("build time")
})
