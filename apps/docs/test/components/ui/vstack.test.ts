import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("VStack docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/vstack.tsx", import.meta.url),
    "@registry/components/ui/vstack",
    "VStack",
  )
})
