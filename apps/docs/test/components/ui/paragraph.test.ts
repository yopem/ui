import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Paragraph docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/paragraph.tsx", import.meta.url),
    "@registry/components/ui/paragraph",
    "Paragraph",
  )
})
