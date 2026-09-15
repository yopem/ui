import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("tooltip portal has a named landmark", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/tooltip.tsx", import.meta.url),
  ).text()

  expect(source).toContain('aria-label="Tooltip"')
  expect(source).toContain('role="region"')
})
