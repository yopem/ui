import { expect, test } from "@playwright/test"
import { registryItemSchema } from "@registry/schema"
import { readdirSync, readFileSync } from "node:fs"

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

  const llms = await (await request.get("/llms.txt")).text()
  expect(llms).toContain("https://ui.yopem.com/components/button.md")
  expect(llms).not.toContain("localhost")
  expect(llms).toContain("init --cwd apps/web --ui ../../packages/ui")
  expect(llms).toContain("add button --cwd packages/ui")
  expect(llms).toContain("update button --cwd packages/ui")
  expect(llms).toContain("relative to the target app")

  const guide = await (await request.get("/docs/installation.md")).text()
  expect(guide).toContain("bunx @yopem-ui/cli init")
  expect(guide).not.toContain("<InstallationCommands />")
  expect(guide).not.toContain("Manual installation")
})

test("design-system-first policy is published and discoverable", async ({
  request,
}, testInfo) => {
  const response = await request.get("/docs/lint.md")
  expect(response.status()).toBe(200)
  const policy = await response.text()

  for (const text of [
    "Heading render",
    "Box render",
    "The rule does not check native anchors or framework links.",
    "Codeblock",
    "styleComponents",
    "conditional branches",
  ])
    expect(policy.replace(/\s+/g, " ")).toContain(text)

  for (const [url, path] of [
    ["/llms.txt", "/docs/lint.md"],
    ["/sitemap.xml", "/docs/lint"],
  ]) {
    const index = await request.get(url)
    expect(index.status()).toBe(200)
    expect(await index.text()).toContain(path)
  }

  await testInfo.attach("design-system-first-policy", {
    body: policy,
    contentType: "text/markdown",
  })
})

test("generated documentation publishes reviewed source text", async ({
  request,
}, testInfo) => {
  const directory = new URL(
    "../../../../packages/registry/dist/r/docs/",
    import.meta.url,
  )

  const files = readdirSync(directory).filter((file) => file.endsWith(".json"))

  expect(files.length).toBeGreaterThan(0)

  for (const file of files) {
    const response = await request.get(`/r/docs/${file}`)
    expect(response.status(), file).toBe(200)
    expect(await response.text(), file).toBe(
      readFileSync(new URL(file, directory), "utf8"),
    )
  }

  await testInfo.attach("reviewed-generated-documentation", {
    body: files.join("\n"),
    contentType: "text/plain",
  })
})

test("all component examples use consumer import paths", async ({
  request,
}, testInfo) => {
  const paths = readdirSync(
    new URL("../../src/catalog/previews/", import.meta.url),
  )
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => `/components/${file.slice(0, -4)}`)

  expect(paths.length).toBeGreaterThan(0)

  for (const path of paths) {
    const response = await request.get(`${path}.md`)
    expect(response.status(), path).toBe(200)
    const source = await response.text()
    expect(source, path).not.toContain("@registry/components/")
    expect(source, path).toContain('from "@/components/ui/')
  }

  await testInfo.attach("checked-component-paths", {
    body: paths.join("\n"),
    contentType: "text/plain",
  })
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

test("callback consumers ship the local event hook without Base UI utilities", async ({
  request,
}, testInfo) => {
  const items = []

  for (const name of [
    "clipboard",
    "codeblock",
    "marquee",
    "rating",
    "sidebar",
    "theme",
  ]) {
    const response = await request.get(`/r/${name}.json`)
    expect(response.status(), name).toBe(200)
    const item = registryItemSchema.parse(await response.json())
    expect(item.dependencies, name).not.toContain("@base-ui/utils@^0.4.0")
    expect(item.registryDependencies, name).toContain("use-event-callback")

    for (const file of item.files) {
      expect(file.content, `${name}/${file.path}`).not.toContain(
        "@base-ui/utils",
      )
    }

    items.push(item)
  }

  await testInfo.attach("event-callback-registry-items", {
    body: JSON.stringify(items, null, 2),
    contentType: "application/json",
  })
})

test("registry hooks are installable, documented, and discoverable", async ({
  request,
}) => {
  for (const [name, exportedName] of [
    ["use-event-callback", "useEventCallback"],
    ["use-media-query", "useMediaQuery"],
  ]) {
    const response = await request.get(`/r/${name}.json`)
    expect(response.status(), name).toBe(200)
    const item = registryItemSchema.parse(await response.json())
    expect(item.type).toBe("registry:hook")
    expect(item.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: `@/hooks/${name}.ts`,
          content: expect.stringContaining(`export function ${exportedName}`),
        }),
      ]),
    )

    const docs = await request.get(`/components/${name}.md`)
    expect(docs.status()).toBe(200)
    expect(await docs.text()).toContain(`from "@/hooks/${name}"`)

    for (const url of ["/llms.txt", "/sitemap.xml"]) {
      const listing = await request.get(url)
      expect(await listing.text()).toContain(`/components/${name}`)
    }
  }
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
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "React components you copy, own, and change.",
  )
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
