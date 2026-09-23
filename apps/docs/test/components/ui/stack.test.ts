import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Stack docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/stack.tsx", import.meta.url),
    "@registry/components/ui/stack",
    "Stack",
  )
})
