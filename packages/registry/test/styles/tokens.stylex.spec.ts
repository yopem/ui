import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { expect, test } from "bun:test"

defineRegistrySourceContract(import.meta.url)

test("destructive surfaces use a white-text contrast-safe token", async () => {
  const source = await Bun.file(
    new URL("../../src/styles/tokens.stylex.ts", import.meta.url),
  ).text()

  expect(
    source.match(/"--destructive": "oklch\(57\.7% 0\.245 27\.325\)"/g),
  ).toHaveLength(2)
})
