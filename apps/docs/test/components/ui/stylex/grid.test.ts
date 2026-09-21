import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Grid docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../../src/components/ui/stylex/grid.tsx", import.meta.url),
    "@registry/components/ui/grid",
    "Grid",
  )
})
