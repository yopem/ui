import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  new URL("../../../src/components/ui/heading.tsx", import.meta.url),
  "utf8",
)

testStylePropsContract("heading")

test("Heading defaults to h2 and accepts only h1 through h6", () => {
  expect(source).toContain('ComponentProps<"h2">')
  expect(source).toContain('as: Component = "h2"')
  expect(source).toContain('type HeadingTag = "h1" | "h2" | "h3"')
  expect(source).toContain('"h4" | "h5" | "h6"')
  expect(source).toContain("<Component")
  expect(source).not.toContain("stylex.create")
  expect(source).not.toContain("useRender")
})
