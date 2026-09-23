import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("group docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/group.tsx", import.meta.url),
    "@registry/components/ui/group",
    "group",
  )
})
