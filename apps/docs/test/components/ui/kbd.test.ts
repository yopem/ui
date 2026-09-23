import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("kbd docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/kbd.tsx", import.meta.url),
    "@registry/components/ui/kbd",
    "kbd",
  )
})
