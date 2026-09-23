import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("input docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/input.tsx", import.meta.url),
    "@registry/components/ui/input",
    "input",
  )
})
