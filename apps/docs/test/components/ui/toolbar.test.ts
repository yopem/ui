import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("toolbar docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/toolbar.tsx", import.meta.url),
    "@registry/components/ui/toolbar",
    "toolbar",
  )
})
