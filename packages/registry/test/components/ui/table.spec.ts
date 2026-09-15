import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("table overflow container is keyboard focusable", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/table.tsx", import.meta.url),
  ).text()

  expect(source).toContain("tabIndex: 0")
})
