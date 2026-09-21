import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("HStack docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../../src/components/ui/stylex/hstack.tsx", import.meta.url),
    "@registry/components/ui/hstack",
    "HStack",
  )
})
