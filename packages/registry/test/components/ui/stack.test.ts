import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  resolve(import.meta.dirname, "../../../src/components/ui/stack.tsx"),
  "utf8",
)

testStylePropsContract("stack")

test("Stack keeps column spacing and consumer CSS precedence", () => {
  expect(source).toContain('display: "flex"')
  expect(source).toContain('flexDirection: "column"')
  expect(source).toContain('gap: `calc(${tokens["--spacing"]} * 4)`')
  expect(source).toContain('data-slot="stack"')
  expect(source).toContain("React.RefAttributes<HTMLDivElement>")
  expect(source.indexOf("styles.root")).toBeLessThan(
    source.indexOf("xstyle), props"),
  )
})
