import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("context-menu portal has a named landmark", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/context-menu.tsx", import.meta.url),
  ).text()

  expect(source).toContain('aria-label="Context menu"')
  expect(source).toContain('role="region"')
  expect(source).toContain('color: tokens["--muted-foreground"]')
})
