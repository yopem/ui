import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("field docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/field.tsx", import.meta.url),
    "@registry/components/ui/field",
    "field",
  )
})
