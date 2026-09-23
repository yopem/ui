import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("fieldset docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/fieldset.tsx", import.meta.url),
    "@registry/components/ui/fieldset",
    "fieldset",
  )
})
