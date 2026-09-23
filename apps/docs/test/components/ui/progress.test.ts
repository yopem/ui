import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("progress docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/progress.tsx", import.meta.url),
    "@registry/components/ui/progress",
    "progress",
  )
})
