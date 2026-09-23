import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("pagination docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/pagination.tsx", import.meta.url),
    "@registry/components/ui/pagination",
    "pagination",
  )
})
