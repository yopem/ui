import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { testStylePropsContract } from "./style-props-contract"

testStylePropsContract("calendar")

test("Calendar does not wrap selection callbacks as DOM event handlers", () => {
  const source = readFileSync(
    new URL("../../../src/components/ui/calendar.tsx", import.meta.url),
    "utf8",
  )
  expect(source).toContain(
    "...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)",
  )
  expect(source).not.toContain('"@base-ui/react/merge-props"')
})
