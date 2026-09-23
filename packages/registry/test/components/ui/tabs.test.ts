import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { testStylePropsContract } from "./style-props-contract"

testStylePropsContract("tabs")

test("unselected tabs keep readable muted text", () => {
  const source = readFileSync(
    new URL("../../../src/components/ui/tabs.tsx", import.meta.url),
    "utf8",
  )
  expect(source).toContain('color: tokens["--muted-foreground"]')
  expect(source).not.toContain(
    "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
  )
})
