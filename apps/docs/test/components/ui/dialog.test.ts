import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("dialog docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/dialog.tsx", import.meta.url),
    "@registry/components/ui/dialog",
    "dialog",
  )
})
