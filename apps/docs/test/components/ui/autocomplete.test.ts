import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("autocomplete docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/autocomplete.tsx", import.meta.url),
    "@registry/components/ui/autocomplete",
    "autocomplete",
  )
})
