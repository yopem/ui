import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("input-group docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/input-group.tsx", import.meta.url),
    "@registry/components/ui/input-group",
    "input-group",
  )
})
