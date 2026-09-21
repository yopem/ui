import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  new URL("../../../src/components/ui/link.tsx", import.meta.url),
  "utf8",
)

testStylePropsContract("link")

test("Link keeps native anchor props, events, and ref typing", () => {
  expect(source).toContain('ComponentProps<"a">')
  expect(source).toContain("<a")
  expect(source).toContain("mergeStyleProps")
  expect(source).not.toContain("stylex.create")
  expect(source).not.toContain("useRender")
})
