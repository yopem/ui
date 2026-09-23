import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("select docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/select.tsx", import.meta.url),
    "@registry/components/ui/select",
    "select",
  )
})
