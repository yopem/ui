import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("toggle docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/toggle.tsx", import.meta.url),
    "@registry/components/ui/toggle",
    "toggle",
  )
})
