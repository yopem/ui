import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("tabs docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/tabs.tsx", import.meta.url),
    "@registry/components/ui/tabs",
    "tabs",
  )
})
