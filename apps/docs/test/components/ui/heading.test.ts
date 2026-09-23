import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Heading docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/heading.tsx", import.meta.url),
    "@registry/components/ui/heading",
    "Heading",
  )
})
