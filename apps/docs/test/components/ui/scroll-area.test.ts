import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("scroll-area docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/scroll-area.tsx", import.meta.url),
    "@registry/components/ui/scroll-area",
    "scroll-area",
  )
})
