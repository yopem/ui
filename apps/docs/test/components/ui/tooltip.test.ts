import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("tooltip docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/tooltip.tsx", import.meta.url),
    "@registry/components/ui/tooltip",
    "tooltip",
  )
})
