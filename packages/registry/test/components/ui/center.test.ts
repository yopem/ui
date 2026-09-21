import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  resolve(import.meta.dirname, "../../../src/components/ui/center.tsx"),
  "utf8",
)

testStylePropsContract("center")

test("Center keeps flex centering and consumer overrides", () => {
  expect(source).toContain('alignItems: "center"')
  expect(source).toContain('display: "flex"')
  expect(source).toContain('justifyContent: "center"')
  expect(source).toContain('data-slot="center"')
  expect(source).toContain("React.RefAttributes<HTMLDivElement>")
  expect(source).toContain("stylexProps(className, styles.root, xstyle)")
})
