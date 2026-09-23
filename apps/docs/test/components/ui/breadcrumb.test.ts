import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("breadcrumb docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/breadcrumb.tsx", import.meta.url),
    "@registry/components/ui/breadcrumb",
    "breadcrumb",
  )
})
