import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("collapsible docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/collapsible.tsx", import.meta.url),
    "@registry/components/ui/collapsible",
    "collapsible",
  )
})
