import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("frame docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/frame.tsx", import.meta.url),
    "@registry/components/ui/frame",
    "frame",
  )
})
