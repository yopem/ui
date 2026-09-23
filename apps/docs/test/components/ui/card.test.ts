import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("card docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/card.tsx", import.meta.url),
    "@registry/components/ui/card",
    "card",
  )
})
