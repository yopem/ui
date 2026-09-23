import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("checkbox-group docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/checkbox-group.tsx", import.meta.url),
    "@registry/components/ui/checkbox-group",
    "checkbox-group",
  )
})
