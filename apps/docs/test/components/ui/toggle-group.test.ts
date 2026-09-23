import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("toggle-group docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/toggle-group.tsx", import.meta.url),
    "@registry/components/ui/toggle-group",
    "toggle-group",
  )
})
