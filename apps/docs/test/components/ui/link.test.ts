import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Link docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/link.tsx", import.meta.url),
    "@registry/components/ui/link",
    "Link",
  )
})
