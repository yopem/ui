import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("label docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/label.tsx", import.meta.url),
    "@registry/components/ui/label",
    "label",
  )
})
