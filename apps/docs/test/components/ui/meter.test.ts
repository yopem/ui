import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("meter docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/meter.tsx", import.meta.url),
    "@registry/components/ui/meter",
    "meter",
  )
})
