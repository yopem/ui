import { expect, test } from "@playwright/test"
import { createHash } from "node:crypto"
import { readFileSync, readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve, sep } from "node:path"

function getInstalledDrawingFonts() {
  const require = createRequire(resolve("apps/docs/package.json"))

  const directory = resolve(
    dirname(require.resolve("@excalidraw/excalidraw")),
    "fonts",
  )

  const families = new Map<string, string>()

  for (const entry of readdirSync(directory, {
    recursive: true,
    encoding: "utf8",
  })) {
    if (!entry.endsWith(".woff2")) continue

    const family = entry.split(sep)[0]

    if (!family) throw new Error("The drawing font has no family directory.")

    if (!families.has(family)) families.set(family, entry)
  }

  if (families.size === 0) {
    throw new Error("The installed drawing SDK has no WOFF2 fonts.")
  }

  return Array.from(families, ([family, file]) => ({
    family,
    bytes: readFileSync(resolve(directory, file)),
    url: `/assets/excalidraw/fonts/${file.split(sep).map(encodeURIComponent).join("/")}`,
  }))
}

test("serves every installed drawing font family locally without changing its bytes", async ({
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
  await testInfo.attach("self-hosted-drawing-fonts", {
    body: JSON.stringify(
      fonts.map((font, index) => ({
        family: font.family,
        resource: font.url,
        bytes: font.bytes.length,
        sha256: createHash("sha256").update(font.bytes).digest("hex"),
        status: statuses[index],
      })),
    ),
    contentType: "application/json",
  })
})
