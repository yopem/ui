import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("accordion docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/accordion.tsx", import.meta.url),
    "@registry/components/ui/accordion",
    "accordion",
  )
})
