import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("alert-dialog docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/alert-dialog.tsx", import.meta.url),
    "@registry/components/ui/alert-dialog",
    "alert-dialog",
  )
})
