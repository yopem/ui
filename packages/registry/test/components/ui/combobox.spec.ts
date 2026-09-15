import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("combobox popup renders options in a named section", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/combobox.tsx", import.meta.url),
  ).text()

  expect(source).toContain('aria-label="Combobox options"')
  expect(source).toContain('render={<section />}')
})
