import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Box docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../../src/components/ui/stylex/box.tsx", import.meta.url),
    "@registry/components/ui/box",
    "Box",
  )
})
