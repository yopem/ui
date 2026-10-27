import { expect, test } from "@playwright/test"

test("each optional renderer produces sanitized SVG from diagram source", async ({
  page,
  baseURL,
}, testInfo) => {
  if (!baseURL) throw new Error("Renderer fixture origin is missing.")

  const origin = new URL(baseURL).origin
  const externalRequests: string[] = []
  const pageErrors: string[] = []

  page.on("request", (request) => {
    const url = request.url()

    if (
      !url.startsWith("data:") &&
      !url.startsWith("blob:") &&
      new URL(url).origin !== origin
    )
      externalRequests.push(url)
  })
  page.on("pageerror", (cause) => pageErrors.push(cause.message))
  await page.goto("/")
  await expect(page.locator("#result")).toHaveText(
    "mermaid:pass, plantuml:pass, graphviz:pass, flowchart:pass, resource-policy:pass",
    { timeout: 120_000 },
  )

  for (const kind of ["mermaid", "plantuml", "graphviz", "flowchart"]) {
    const image = page.getByRole("img", {
      name: `${kind} diagram`,
      exact: true,
    })

    await expect(image).toBeVisible()

    const size = await image.evaluate((node) => {
      if (!(node instanceof HTMLImageElement))
        throw new Error("Renderer output is not an image.")

      return { width: node.naturalWidth, height: node.naturalHeight }
    })

    expect(size.width).toBeGreaterThan(0)
    expect(size.width).toBeLessThanOrEqual(4096)
    expect(size.height).toBeGreaterThan(0)
    expect(size.height).toBeLessThanOrEqual(4096)

    const source = await image.getAttribute("src")
    const prefix = "data:image/svg+xml,"

    if (!source?.startsWith(prefix))
      throw new Error("Renderer SVG source is missing.")

    await testInfo.attach(`${kind}.svg`, {
      body: Buffer.from(decodeURIComponent(source.slice(prefix.length))),
      contentType: "image/svg+xml",
    })
    await testInfo.attach(`${kind}.png`, {
      body: await image.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  expect(externalRequests).toEqual([])
  expect(pageErrors).toEqual([])
})
