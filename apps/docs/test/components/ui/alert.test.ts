import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("alert docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/alert.tsx", import.meta.url),
    "@registry/components/ui/alert",
    "alert",
  )
})
