import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("otp-field docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/otp-field.tsx", import.meta.url),
    "@registry/components/ui/otp-field",
    "otp-field",
  )
})
