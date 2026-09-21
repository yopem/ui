import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  resolve(import.meta.dirname, "../../../src/components/ui/hstack.tsx"),
  "utf8",
)

testStylePropsContract("hstack")

test("HStack keeps centered horizontal spacing and xstyle precedence", () => {
  expect(source).toContain('alignItems: "center"')
  expect(source).toContain('display: "flex"')
  expect(source).toContain('flexDirection: "row"')
  expect(source).toContain('gap: `calc(${tokens["--spacing"]} * 4)`')
  expect(source).toContain('data-slot="hstack"')
  expect(source).toContain("React.RefAttributes<HTMLDivElement>")
  expect(source).toContain("stylexProps(className, styles.root, xstyle)")
})
