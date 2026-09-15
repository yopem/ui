import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

runDocsSourceContract("catalog/api-reference.tsx")

test("API tables use part-specific landmark names", async () => {
  const source = await Bun.file(
    new URL("../../src/catalog/api-reference.tsx", import.meta.url),
  ).text()

  expect(source).toContain(
    "aria-label={`${name} ${label.toLowerCase()} reference`}",
  )
  expect(source).toContain("name={part.name}")
})
