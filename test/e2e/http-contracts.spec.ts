import { expect, test } from "@playwright/test"

test("machine-readable documentation endpoints expose correct formats", async ({
  request,
}) => {
  const cases = [
    ["/components.md", "text/markdown", "# Components"],
    ["/components/button.md", "text/markdown", "# Button"],
    ["/docs/installation.md", "text/markdown", "# Installation"],
    ["/docs/styling.md", "text/markdown", "# Styling with StyleX"],
    ["/index.md", "text/markdown", "# Introduction"],
    ["/llms.txt", "text/plain", "/components/button.md"],
    ["/sitemap.xml", "application/xml", "/components/button"],
  ] as const

  for (const [url, contentType, text] of cases) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(200)
    expect(response.headers()["content-type"], url).toContain(contentType)
    expect(await response.text(), url).toContain(text)
  }

  const guide = await (await request.get("/docs/installation.md")).text()
  expect(guide).toContain("bunx @yopem-ui/cli init")
  expect(guide).not.toContain("<InstallationCommands />")
  expect(guide).not.toContain("Manual installation")
})

test("Container is discoverable and installable from registry", async ({
  request,
}) => {
  for (const [url, content] of [
    ["/llms.txt", "/components/container"],
    ["/sitemap.xml", "/components/container"],
    ["/components/container.md", "fluid"],
  ]) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(200)
    expect(await response.text()).toContain(content)
  }

  const response = await request.get("/r/container.json")
  expect(response.status()).toBe(200)
  const item = await response.json()
  expect(item.name).toBe("container")
  expect(item.registryDependencies).toContain("base")
  expect(item.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        target: "@/components/ui/container.tsx",
        content: expect.stringContaining("export function Container"),
      }),
    ]),
  )
})

test("new components are listed, documented, and installable", async ({
  request,
}) => {
  for (const name of [
    "absolute-center",
    "bleed",
    "blockquote",
    "checkmark",
    "clipboard",
    "codeblock",
    "em",
    "float",
    "highlight",
    "mark",
    "marquee",
    "native-select",
    "prose",
    "rating",
    "stat",
    "steps",
    "text",
    "wrap",
  ]) {
    const itemResponse = await request.get(`/r/${name}.json`)
    expect(itemResponse.status(), name).toBe(200)
    const item = await itemResponse.json()
    expect(item.name).toBe(name)
    expect(item.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ target: `@/components/ui/${name}.tsx` }),
      ]),
    )
    const docs = await request.get(`/components/${name}.md`)
    expect(docs.status(), name).toBe(200)
    expect(await docs.text()).toContain(`# ${item.title}`)

    for (const url of ["/llms.txt", "/sitemap.xml"]) {
      const response = await request.get(url)
      expect(response.status(), url).toBe(200)
      expect(await response.text(), url).toContain(`/components/${name}`)
    }
  }

  const removed = await request.get("/r/paragraph.json")
  expect(removed.status()).toBe(404)
})

test("dynamic documentation routes return real 404 responses", async ({
  request,
}) => {
  for (const url of [
    "/components/missing.md",
    "/docs/missing.md",
    "/components/missing",
    "/examples",
    "/examples/p-button-1",
  ]) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(404)
  }
})

test("missing components show the not found page", async ({ page }) => {
  await page.goto("/components/missing")
  await expect(
    page.getByText("Component not found", { exact: true }),
  ).toBeVisible()
})

test("legacy StyleX route redirects and stored theme applies to docs", async ({
  page,
  request,
}) => {
  const redirect = await request.get("/stylex", { maxRedirects: 0 })
  expect(redirect.status()).toBeGreaterThanOrEqual(300)
  expect(redirect.status()).toBeLessThan(400)
  expect(redirect.headers().location).toBe("/components")

  await page.goto("/components/button")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
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
