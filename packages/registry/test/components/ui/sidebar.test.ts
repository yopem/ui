import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { testStylePropsContract } from "./style-props-contract"

testStylePropsContract("sidebar")

test("mobile Sidebar forwards DOM and inline styles to popup, not controller", () => {
  const source = readFileSync(
    resolve(import.meta.dirname, "../../../src/components/ui/sidebar.tsx"),
    "utf8",
  )
  expect(source).toContain(
    "<Sheet onOpenChange={setOpenMobile} open={openMobile}>",
  )
  expect(source).toMatch(/<SheetPopup[\s\S]*?side=\{side\}\s+\{\.\.\.props\}/)
})
