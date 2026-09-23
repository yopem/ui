import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Flex docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/flex.tsx", import.meta.url),
    "@registry/components/ui/flex",
    "Flex",
  )
})
