import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("table docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/table.tsx", import.meta.url),
    "@registry/components/ui/table",
    "table",
  )
})
