import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  new URL("../../../src/components/ui/paragraph.tsx", import.meta.url),
  "utf8",
)

testStylePropsContract("paragraph")

test("Paragraph keeps native paragraph semantics and native props", () => {
  expect(source).toContain('ComponentProps<"p">')
  expect(source).toContain("<p")
  expect(source).toContain("mergeStyleProps")
  expect(source).not.toContain("stylex.create")
  expect(source).not.toContain("useRender")
})
