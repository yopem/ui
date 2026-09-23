import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("calendar docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/calendar.tsx", import.meta.url),
    "@registry/components/ui/calendar",
    "calendar",
  )
})
