import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("separator docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/separator.tsx", import.meta.url),
    "@registry/components/ui/separator",
    "separator",
  )
})
