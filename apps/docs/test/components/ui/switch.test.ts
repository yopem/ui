import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("switch docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/switch.tsx", import.meta.url),
    "@registry/components/ui/switch",
    "switch",
  )
})
