import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  resolve(import.meta.dirname, "../../../src/components/ui/flex.tsx"),
  "utf8",
)

testStylePropsContract("flex")

test("Flex keeps display default, native handlers, refs, and overrides", () => {
  expect(source).toContain('root: { display: "flex" }')
  expect(source).toContain('React.ComponentPropsWithoutRef<"div">')
  expect(source).toContain("React.RefAttributes<HTMLDivElement>")
  expect(source).toContain('data-slot="flex"')
  expect(source).toContain("const xstyle = [styleProps, consumerXstyle]")
  expect(source).toContain("stylexProps(className, styles.root, xstyle)")
  expect(source).not.toContain("html.")
})
