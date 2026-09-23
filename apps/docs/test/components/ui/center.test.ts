import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Center docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/center.tsx", import.meta.url),
    "@registry/components/ui/center",
    "Center",
  )
})
