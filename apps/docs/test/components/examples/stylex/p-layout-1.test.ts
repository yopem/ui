import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-layout-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("layout fixture covers all ten primitives without an HTML factory", () => {
  for (const component of [
    "Box",
    "Flex",
    "Grid",
    "Stack",
    "VStack",
    "HStack",
    "Center",
    "Link",
    "Paragraph",
    "Heading",
  ]) {
    expect(source).toContain(`import { ${component} }`)
  }
  expect(source).not.toContain("html.")
  expect(source).toContain('display={{ base: "block", md: "flex" }}')
  expect(source).toContain('dir="rtl"')
  expect(source).toContain('href="#destination"')
  expect(source).toContain("export function Example()")
  expect(source).toContain('data-testid="override-hstack"')
  expect(source).toContain("xstyle={styles.override}")
  expect(source).toContain('gap: "5px"')
  expect(source).toContain("<Button")
  expect(source).not.toContain('as="button"')
})

test("layout fixture exercises heading levels, native names, refs, and form state", () => {
  for (const level of ["h1", "h3", "h4", "h5", "h6"]) {
    expect(source).toContain(`as="${level}"`)
  }
  expect(source).toContain('data-testid="preserved-heading"')
  expect(source).toContain('htmlFor="layout-name"')
  expect(source).toContain('name="name"')
  expect(source).toContain("paragraphRef")
  expect(source).toContain("linkRef")
  expect(source).toContain('data-testid="submit-status"')
})
