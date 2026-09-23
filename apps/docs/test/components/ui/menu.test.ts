import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("menu docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/menu.tsx", import.meta.url),
    "@registry/components/ui/menu",
    "menu",
  )
})
