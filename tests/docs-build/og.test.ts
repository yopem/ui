import { renderOgImage } from "@workspace/apps/docs/src/lib/og"
import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

const fromDocs = createRequire(
  resolve(import.meta.dirname, "../../apps/docs/package.json"),
)

const fonts = [
  "@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf",
  "@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf",
].map((path) => new Uint8Array(readFileSync(fromDocs.resolve(path))).buffer)

const [regularFont, boldFont] = fonts

describe("native documentation OG images", () => {
  for (const title of [
    "Native editor",
    "A long documentation heading for composable native rich-text editor controls",
    "Native editor Ω and café",
  ]) {
    test(`renders a bounded PNG for ${title}`, async () => {
      const png = await renderOgImage(
        title,
        "Accessible editor controls and document workflows.",
        regularFont,
        boldFont,
      )

      expect(png.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      )
      expect(png.readUInt32BE(16)).toBe(1200)
      expect(png.readUInt32BE(20)).toBe(630)
      expect(png.byteLength).toBeGreaterThan(256)
      expect(png.byteLength).toBeLessThanOrEqual(2 * 1024 * 1024)
    })
  }

  test("the supplied fonts produce repeatable output", async () => {
    const first = await renderOgImage(
      "Native editor",
      "Accessible editor controls.",
      regularFont,
      boldFont,
    )

    const repeated = await renderOgImage(
      "Native editor",
      "Accessible editor controls.",
      regularFont,
      boldFont,
    )

    const changed = await renderOgImage(
      "Document conversion",
      "Accessible editor controls.",
      regularFont,
      boldFont,
    )

    expect(repeated).toEqual(first)
    expect(changed.equals(first)).toBe(false)
  })
})
