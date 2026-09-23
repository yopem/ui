import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("toast docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/toast.tsx", import.meta.url),
    "@registry/components/ui/toast",
    "toast",
  )
})
