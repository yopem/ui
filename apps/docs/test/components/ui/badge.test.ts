import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("badge docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/badge.tsx", import.meta.url),
    "@registry/components/ui/badge",
    "badge",
  )
})
