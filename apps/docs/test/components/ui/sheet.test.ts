import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("sheet docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/sheet.tsx", import.meta.url),
    "@registry/components/ui/sheet",
    "sheet",
  )
})
