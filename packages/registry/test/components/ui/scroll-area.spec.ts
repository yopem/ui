import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("scroll-area viewport is a keyboard-accessible region", async () => {
  const source = await Bun.file(
    new URL("../../../src/components/ui/scroll-area.tsx", import.meta.url),
  ).text()

  expect(source).toContain("aria-label={ariaLabel}")
  expect(source).toContain("<section")
  expect(source).toContain("tabIndex={0}")
})
