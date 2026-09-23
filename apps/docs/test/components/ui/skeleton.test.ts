import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("skeleton docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/skeleton.tsx", import.meta.url),
    "@registry/components/ui/skeleton",
    "skeleton",
  )
})
