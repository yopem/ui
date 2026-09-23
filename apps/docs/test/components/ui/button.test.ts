import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("button docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/button.tsx", import.meta.url),
    "@registry/components/ui/button",
    "button",
  )
})
