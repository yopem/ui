import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("slider docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/slider.tsx", import.meta.url),
    "@registry/components/ui/slider",
    "slider",
  )
})
