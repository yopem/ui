import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("select popup portal has a named landmark", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/select.tsx", import.meta.url),
  ).text()

  expect(source).toContain('aria-label="Select options"')
  expect(source).toContain('role="region"')
})
