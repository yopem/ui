import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("textarea docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/textarea.tsx", import.meta.url),
    "@registry/components/ui/textarea",
    "textarea",
  )
})
