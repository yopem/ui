import { expect, test } from "@playwright/test"
import { registryItemSchema, registrySchema } from "@registry/schema"
import { z } from "zod"

const documentationSchema = z.object({
  name: z.string(),
  usage: z.string().min(1),
  parts: z.array(z.object({ name: z.string().min(1) })),
  installation: z.object({
    files: z.array(z.object({ path: z.string(), target: z.string() })).min(1),
    registryDependencies: z.array(z.string()),
  }),
})

test("machine-readable documentation exposes formats and public resources", async ({
  request,
}, testInfo) => {
  const bodies = new Map<string, string>()

  for (const [url, contentType] of [
    ["/components.md", "text/markdown"],
    ["/components/button.md", "text/markdown"],
    ["/components/aspect-ratio.md", "text/markdown"],
    ["/components/list.md", "text/markdown"],
    ["/components/strong.md", "text/markdown"],
    ["/components/figcaption.md", "text/markdown"],
    ["/docs/installation.md", "text/markdown"],
    ["/docs/styling.md", "text/markdown"],
    ["/docs/lint.md", "text/markdown"],
    ["/index.md", "text/markdown"],
    ["/llms.txt", "text/plain"],
    ["/sitemap.xml", "application/xml"],
  ]) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(200)
    expect(response.headers()["content-type"], url).toContain(contentType)
    const body = await response.text()
    expect(body.trim(), url).not.toBe("")

    if (contentType === "text/markdown") expect(body, url).toMatch(/^# /)
    bodies.set(url, body)
  }

  const llms = bodies.get("/llms.txt") ?? ""

  const links = [...llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(
    (match) => new URL(match[1]),
  )

  expect(links.length).toBeGreaterThan(0)

  for (const link of links) expect(link.origin).toBe("https://ui.yopem.com")
  const paths = links.map((link) => link.pathname)

  for (const path of [
    "/components/button.md",
    "/components/aspect-ratio.md",
    "/components/list.md",
    "/components/strong.md",
    "/components/figcaption.md",
    "/docs/cli.md",
    "/docs/layout.md",
    "/docs/theming.md",
    "/docs/lint.md",
    "/r/registry.json",
    "/r/docs/button.json",
    "/schema/registry-item.json",
  ])
    expect(paths).toContain(path)

  expect(bodies.get("/sitemap.xml")).toContain(
    "<loc>https://ui.yopem.com/docs/lint</loc>",
  )
  expect(bodies.get("/docs/installation.md")).not.toContain(
    "<InstallationCommands />",
  )

  for (const command of [
    "bunx --bun @yopem-ui/cli init",
    "npx @yopem-ui/cli init",
    "pnpm dlx @yopem-ui/cli init",
    "yarn dlx @yopem-ui/cli init",
  ])
    expect(llms).toContain(command)
  expect(llms).not.toContain("bunx @yopem-ui/cli")

  for (const path of paths.filter((path) => path.startsWith("/schema/"))) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect(response.headers()["content-type"], path).toContain(
      "application/json",
    )
    expect(
      z.object({ type: z.literal("object") }).parse(await response.json()).type,
    ).toBe("object")
  }

  await testInfo.attach("llms-current-guidance", {
    body: llms,
    contentType: "text/plain",
  })
})

test("public registry inventory ships source, dependencies, and documentation", async ({
  request,
}, testInfo) => {
  test.setTimeout(120_000)
  const response = await request.get("/r/registry.json")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toContain("application/json")
  const registry = registrySchema.parse(await response.json())
  expect(registry.items.length).toBeGreaterThan(0)
  const names = registry.items.map((item) => item.name)

  for (const name of [
    "container",
    "clipboard",
    "codeblock",
    "marquee",
    "rating",
    "sidebar",
    "theme",
    "use-event-callback",
    "use-media-query",
  ])
    expect(names).toContain(name)
  const llms = await (await request.get("/llms.txt")).text()
  const sitemap = await (await request.get("/sitemap.xml")).text()

  for (const entry of registry.items) {
    const itemResponse = await request.get(`/r/${entry.name}.json`)
    expect(itemResponse.status(), entry.name).toBe(200)
    expect(itemResponse.headers()["content-type"], entry.name).toContain(
      "application/json",
    )
    const item = registryItemSchema.parse(await itemResponse.json())
    expect(item.name).toBe(entry.name)
    expect(item.type).toBe(entry.type)

    if (["use-event-callback", "use-media-query"].includes(item.name))
      expect(item.type).toBe("registry:hook")
    expect(item.registryDependencies).toEqual(entry.registryDependencies)
    expect(item.files.map(({ path, target }) => ({ path, target }))).toEqual(
      entry.files.map(({ path, target }) => ({ path, target })),
    )

    for (const dependency of item.registryDependencies)
      expect(names).toContain(dependency)

    for (const file of item.files) {
      expect(file.content?.trim(), `${item.name}/${file.path}`).toBeTruthy()
      expect(file.content, `${item.name}/${file.path}`).not.toContain(
        "@registry/",
      )
    }

    if (item.type === "registry:ui" || item.type === "registry:hook") {
      const target =
        item.type === "registry:hook"
          ? `@/hooks/${item.name}.ts`
          : `@/components/ui/${item.name}.tsx`

      expect(item.files).toEqual(
        expect.arrayContaining([expect.objectContaining({ target })]),
      )
    }

    if (item.name === "container")
      expect(item.registryDependencies).toContain("base")

    if (
      [
        "clipboard",
        "codeblock",
        "marquee",
        "rating",
        "sidebar",
        "theme",
      ].includes(item.name)
    ) {
      expect(item.registryDependencies, item.name).toContain(
        "use-event-callback",
      )

      for (const dependency of item.dependencies)
        expect(dependency).not.toMatch(/^@base-ui\/utils(?:@|$)/)

      for (const file of item.files)
        expect(file.content).not.toContain("@base-ui/utils")
    }

    const docsResponse = await request.get(`/r/docs/${item.name}.json`)
    expect(docsResponse.status(), item.name).toBe(200)
    expect(docsResponse.headers()["content-type"], item.name).toContain(
      "application/json",
    )
    const docs = documentationSchema.parse(await docsResponse.json())
    expect(docs.name).toBe(item.name)
    expect(docs.installation.files).toEqual(
      item.files.map(({ path, target }) => ({ path, target })),
    )
    expect(docs.installation.registryDependencies).toEqual(
      item.registryDependencies,
    )

    if (item.type === "registry:ui" || item.type === "registry:hook")
      expect(docs.parts.length, item.name).toBeGreaterThan(0)
  }

  const index = await request.get("/components.md")
  expect(index.status()).toBe(200)

  const paths = [
    ...(await index.text()).matchAll(/\]\((\/components\/[a-z0-9-]+\.md)\)/g),
  ].map((match) => match[1])

  expect(paths.length).toBeGreaterThan(0)

  for (const item of registry.items) {
    if (item.type === "registry:ui" || item.type === "registry:hook")
      expect(paths, item.name).toContain(`/components/${item.name}.md`)
  }

  for (const path of paths) {
    expect(llms, path).toContain(`https://ui.yopem.com${path}`)
    expect(sitemap, path).toContain(
      `<loc>https://ui.yopem.com${path.slice(0, -3)}</loc>`,
    )
    const docs = await request.get(path)
    expect(docs.status(), path).toBe(200)
    const examples = (await docs.text()).split("## API reference")[0]
    expect(examples, path).not.toContain("@registry/")
    expect(examples, path).toMatch(/from "@\/(?:components\/ui|hooks)\//)
  }

  for (const name of ["use-event-callback", "use-media-query"]) {
    const docs = await request.get(`/components/${name}.md`)
    expect(await docs.text()).toContain(`from "@/hooks/${name}"`)
  }

  const removed = await request.get("/r/paragraph.json")
  expect(removed.status()).toBe(404)
  await testInfo.attach("checked-public-registry", {
    body: JSON.stringify({ names, paths }, null, 2),
    contentType: "application/json",
  })
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
    page.getByRole("heading", { name: "Page not found", level: 1 }),
  ).toBeVisible()
})

test("legacy StyleX route redirects to components", async ({ request }) => {
  const redirect = await request.get("/stylex", { maxRedirects: 0 })
  expect(redirect.status()).toBeGreaterThanOrEqual(300)
  expect(redirect.status()).toBeLessThan(400)
  expect(redirect.headers().location).toBe("/components")
})

test("Open Graph metadata points to a cacheable static PNG", async ({
  page,
  request,
}) => {
  await page.goto("/components/button")

  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content")

  expect(imageUrl).toBe("https://ui.yopem.com/og/components/button.png")
  const response = await request.get("/og/components/button.png")

  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toBe("image/png")
  expect(response.headers()["cache-control"]).toContain("max-age=86400")
  expect(response.headers()["x-content-type-options"]).toBe("nosniff")
  const image = await response.body()
  expect([...image.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
})

test("static navigation needs no server functions", async ({ page }) => {
  await page.route("**/_server/**", (route) => route.abort())
  await page.goto("/components/button")
  await page.getByRole("link", { name: "UI", exact: true }).click()
  await page.waitForURL((url) => url.pathname === "/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await page.getByRole("button", { name: "Search documentation" }).click()
  const search = page.getByRole("dialog", { name: "Search documentation" })
  await expect(search).toBeVisible()
  await expect(search.getByRole("searchbox")).toBeFocused()
  await search.getByRole("searchbox").fill("Accordion")
  await search
    .getByRole("link", { name: "Accordion", exact: true })
    .first()
    .click()
  await expect(
    page.getByRole("heading", { name: "Accordion", level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy Accordion usage", exact: true }),
  ).toBeEnabled()
})
