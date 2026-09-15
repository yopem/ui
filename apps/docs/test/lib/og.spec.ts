import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"
import { fileURLToPath } from "node:url"

import { renderOgImage } from "@/lib/og"

runDocsSourceContract("lib/og.tsx")

test("OG renderer returns a 1200 by 630 PNG", async () => {
  const regularFont = await Bun.file(
    fileURLToPath(
      import.meta
        .resolve("@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf"),
    ),
  ).arrayBuffer()
  const boldFont = await Bun.file(
    fileURLToPath(
      import.meta
        .resolve("@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf"),
    ),
  ).arrayBuffer()
  const png = await renderOgImage(
    "Button · Yopem UI",
    "Accessible component docs.",
    regularFont,
    boldFont,
  )

  expect(png.subarray(1, 4).toString()).toBe("PNG")
  expect(png.readUInt32BE(16)).toBe(1200)
  expect(png.readUInt32BE(20)).toBe(630)
})
