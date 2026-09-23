import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("combobox docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/combobox.tsx", import.meta.url),
    "@registry/components/ui/combobox",
    "combobox",
  )
})
