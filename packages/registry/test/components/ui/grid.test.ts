import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  resolve(import.meta.dirname, "../../../src/components/ui/grid.tsx"),
  "utf8",
)

testStylePropsContract("grid")

test("Grid keeps grid display and native event/ref props", () => {
  expect(source).toContain('root: { display: "grid" }')
  expect(source).toContain('data-slot="grid"')
  expect(source).toContain('React.ComponentPropsWithoutRef<"div">')
  expect(source).toContain("React.RefAttributes<HTMLDivElement>")
  expect(source).toContain("const xstyle = consumerXstyle")
})
