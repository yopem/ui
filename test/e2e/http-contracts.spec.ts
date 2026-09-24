import { expect, test } from "@playwright/test"

test("machine-readable documentation endpoints expose correct formats", async ({
  request,
}) => {
  const cases = [
    ["/components.md", "text/markdown", "# Components"],
    ["/components/button.md", "text/markdown", "# Button"],
    ["/docs/installation.md", "text/markdown", "# Installation"],
    ["/index.md", "text/markdown", "# Introduction"],
    ["/llms.txt", "text/plain", "/components/button.md"],
    ["/sitemap.xml", "application/xml", "/examples/p-button-1"],
  ] as const

  for (const [url, contentType, text] of cases) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(200)
    expect(response.headers()["content-type"], url).toContain(contentType)
    expect(await response.text(), url).toContain(text)
  }

  const guide = await (await request.get("/docs/installation.md")).text()
  expect(guide).toContain("bunx @yopem-ui/cli init")
  expect(guide).not.toContain("<InstallationMethods />")
})

test("dynamic documentation routes return real 404 responses", async ({
  request,
}) => {
  for (const url of [
    "/components/missing.md",
    "/docs/missing.md",
    "/components/missing",
  ]) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(404)
  }
})

test("missing examples show the not found page", async ({ page }) => {
  await page.goto("/examples/missing")
  await expect(
    page.getByRole("heading", { name: "Page not found", level: 1 }),
  ).toBeVisible()
})

test("legacy StyleX route redirects and invalid themes normalize to light", async ({
  page,
  request,
}) => {
  const redirect = await request.get("/stylex", { maxRedirects: 0 })
  expect(redirect.status()).toBeGreaterThanOrEqual(300)
  expect(redirect.status()).toBeLessThan(400)
  expect(redirect.headers().location).toBe("/components")

  await page.goto("/examples/p-button-1?theme=invalid")
  await expect(page.locator("[data-example-root]")).toHaveAttribute(
    "data-theme",
    "light",
  )
})

test("Open Graph endpoint returns a cacheable PNG", async ({ request }) => {
  const response = await request.get(
    "/api/og?title=%20Button%20&description=Accessible%20button",
  )
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toBe("image/png")
  expect(response.headers()["cache-control"]).toContain("max-age=86400")
  expect(response.headers()["x-content-type-options"]).toBe("nosniff")
  const image = await response.body()
  expect([...image.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
})
