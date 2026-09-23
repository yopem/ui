import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("context-menu docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/context-menu.tsx", import.meta.url),
    "@registry/components/ui/context-menu",
    "context-menu",
  )
})
