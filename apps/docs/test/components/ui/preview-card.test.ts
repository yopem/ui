import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("preview-card docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/preview-card.tsx", import.meta.url),
    "@registry/components/ui/preview-card",
    "preview-card",
  )
})
