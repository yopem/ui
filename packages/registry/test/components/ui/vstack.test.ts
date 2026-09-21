import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

const source = readFileSync(
  resolve(import.meta.dirname, "../../../src/components/ui/vstack.tsx"),
  "utf8",
)

testStylePropsContract("vstack")

test("VStack keeps centered vertical spacing and native DOM props", () => {
  expect(source).toContain('alignItems: "center"')
  expect(source).toContain('display: "flex"')
  expect(source).toContain('flexDirection: "column"')
  expect(source).toContain('gap: `calc(${tokens["--spacing"]} * 4)`')
  expect(source).toContain('data-slot="vstack"')
  expect(source).toContain('React.ComponentPropsWithoutRef<"div">')
  expect(source).toContain("React.RefAttributes<HTMLDivElement>")
})
