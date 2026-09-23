import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("number-field docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/number-field.tsx", import.meta.url),
    "@registry/components/ui/number-field",
    "number-field",
  )
})
