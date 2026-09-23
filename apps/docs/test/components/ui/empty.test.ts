import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("empty docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/empty.tsx", import.meta.url),
    "@registry/components/ui/empty",
    "empty",
  )
})
