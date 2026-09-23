import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("popover docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/popover.tsx", import.meta.url),
    "@registry/components/ui/popover",
    "popover",
  )
})
