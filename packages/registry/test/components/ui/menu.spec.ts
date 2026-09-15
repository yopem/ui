import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("menu portal renders as a named section", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/menu.tsx", import.meta.url),
  ).text()

  expect(source).toContain('aria-label="Menu"')
  expect(source).toContain('render={<section />}')
})
