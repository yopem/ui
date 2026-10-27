import { expect, test } from "@playwright/test"
import { interFontBySdkFile } from "@workspace/apps/docs/scripts/excalidraw-font-map"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve, sep } from "node:path"

function getInstalledDrawingFonts() {
  const require = createRequire(resolve("apps/docs/package.json"))

  const sdkFontDirectory = resolve(
    dirname(require.resolve("@excalidraw/excalidraw")),
    "fonts",
  )

  const interPackageDirectory = dirname(
    require.resolve("@fontsource-variable/inter/package.json"),
  )

  const interFontDirectory = resolve(interPackageDirectory, "files")

  const files = readdirSync(sdkFontDirectory, {
    recursive: true,
    encoding: "utf8",
  }).filter((file) => file.endsWith(".woff2"))

  const families = new Map<string, string>()
  const nunitoFiles = files.filter((file) => file.startsWith(`Nunito${sep}`))

  for (const file of files) {
    if (file.startsWith(`Nunito${sep}`)) continue

    const family = file.split(sep)[0]

    if (!family) throw new Error("The drawing font has no family directory.")

    if (!families.has(family)) families.set(family, file)
  }

  if (families.size === 0) {
    throw new Error("The installed drawing SDK has no WOFF2 fonts.")
  }

  if (
    nunitoFiles.length !== interFontBySdkFile.size ||
    nunitoFiles.some((file) => !interFontBySdkFile.has(file))
  )
    throw new Error("The installed SDK Nunito font map has changed.")

  const selectedFiles = [...families.values(), ...nunitoFiles]

  return selectedFiles.map((file) => {
    const interFile = interFontBySdkFile.get(file)
    const family = file.split(sep)[0]

    if (!family) throw new Error("The drawing font has no family directory.")

    return {
      family,
      bytes: readFileSync(
        interFile
          ? resolve(interFontDirectory, interFile)
          : resolve(sdkFontDirectory, file),
      ),
      url: `/assets/excalidraw/fonts/${file.split(sep).map(encodeURIComponent).join("/")}`,
    }
  })
}

test("serves local drawing fonts and maps Nunito assets to Inter", async ({
  page,
  request,
}, testInfo) => {
  test.slow()
  const fonts = getInstalledDrawingFonts()

  for (const font of fonts) {
    const response = await request.get(font.url)

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toMatch(/font\/woff2/)
    expect(await response.body()).toEqual(font.bytes)
  }

  await page.goto("/", { waitUntil: "domcontentloaded" })
  const sources = fonts.map((font) => new URL(font.url, page.url()).href)

  const statuses = await page.evaluate(async (urls) => {
    const result: string[] = []

    for (const [index, source] of urls.entries()) {
      const family = `YopemDrawingAssetProbe${index}`
      const loaded = await new FontFace(family, `url("${source}")`).load()

      document.fonts.add(loaded)

      try {
        await document.fonts.load(`16px ${family}`)
        result.push(loaded.status)
      } finally {
        document.fonts.delete(loaded)
      }
    }

    return result
  }, sources)

  expect(statuses).toEqual(fonts.map(() => "loaded"))

  const nunitoLatin = fonts.find((font) =>
    font.url.endsWith(
      "Nunito-Regular-XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdTQ3j6zbXWjgeg.woff2",
    ),
  )

  if (!nunitoLatin) throw new Error("The Nunito Latin Inter asset is missing.")

  const measurement = await page.evaluate(async (source) => {
    const faces = await Promise.all([
      new FontFace("YopemDrawingInterProbe", `url("${source}")`, {
        weight: "500",
      }).load(),
      new FontFace("Nunito", `url("${source}")`, { weight: "500" }).load(),
    ])

    for (const face of faces) document.fonts.add(face)

    try {
      const text = "Yopem UI canvas measurement"

      await document.fonts.load('500 16px "YopemDrawingInterProbe"', text)
      await document.fonts.load("500 16px Nunito", text)

      const context = document.createElement("canvas").getContext("2d")

      if (!context) return null

      context.font = '500 16px "YopemDrawingInterProbe"'
      const inter = context.measureText(text).width
      context.font = "500 16px Nunito"

      return {
        inter,
        nunito: context.measureText(text).width,
        statuses: faces.map((face) => face.status),
      }
    } finally {
      for (const face of faces) document.fonts.delete(face)
    }
  }, new URL(nunitoLatin.url, page.url()).href)

  expect(measurement).not.toBeNull()
  expect(measurement?.statuses).toEqual(["loaded", "loaded"])
  expect(measurement?.inter).toBeGreaterThan(0)
  expect(measurement?.nunito).toBe(measurement?.inter)

  await testInfo.attach("self-hosted-drawing-fonts", {
    body: JSON.stringify({
      fonts: fonts.map((font, index) => ({
        family: font.family,
        resource: font.url,
        bytes: font.bytes.length,
        sha256: createHash("sha256").update(font.bytes).digest("hex"),
        status: statuses[index],
      })),
      measurement,
    }),
    contentType: "application/json",
  })
})
