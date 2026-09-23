import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("radio-group docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/radio-group.tsx", import.meta.url),
    "@registry/components/ui/radio-group",
    "radio-group",
  )
})
