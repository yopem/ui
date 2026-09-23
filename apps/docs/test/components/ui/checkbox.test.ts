import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("checkbox docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/checkbox.tsx", import.meta.url),
    "@registry/components/ui/checkbox",
    "checkbox",
  )
})
