import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("avatar docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/avatar.tsx", import.meta.url),
    "@registry/components/ui/avatar",
    "avatar",
  )
})
