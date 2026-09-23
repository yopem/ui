import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("spinner docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/spinner.tsx", import.meta.url),
    "@registry/components/ui/spinner",
    "spinner",
  )
})
