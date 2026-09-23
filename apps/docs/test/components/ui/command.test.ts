import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("command docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL("../../../src/components/ui/command.tsx", import.meta.url),
    "@registry/components/ui/command",
    "command",
  )
})
