import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("autocomplete popup renders suggestions in a named section", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/autocomplete.tsx", import.meta.url),
  ).text()

  expect(source).toContain('aria-label="Autocomplete suggestions"')
  expect(source).toContain('render={<section />}')
})
