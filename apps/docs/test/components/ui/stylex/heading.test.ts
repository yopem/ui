import { test } from "bun:test"

import { expectCanonicalReexport } from "./reexport-contract"

test("Heading docs wrapper preserves canonical ownership", () => {
  expectCanonicalReexport(
    new URL(
      "../../../../src/components/ui/stylex/heading.tsx",
      import.meta.url,
    ),
    "@registry/components/ui/heading",
    "Heading",
  )
})
