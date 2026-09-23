import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("sidebar docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/sidebar.tsx", import.meta.url),
    "@registry/components/ui/sidebar",
    "sidebar",
  )
})
