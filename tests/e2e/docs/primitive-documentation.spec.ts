import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

const components = [
  ["box", "Box"],
  ["flex", "Flex"],
  ["stack", "Stack"],
  ["hstack", "HStack"],
  ["vstack", "VStack"],
  ["grid", "Grid"],
  ["center", "Center"],
  ["container", "Container"],
  ["absolute-center", "Absolute Center"],
  ["aspect-ratio", "Aspect Ratio"],
  ["bleed", "Bleed"],
  ["float", "Float"],
  ["wrap", "Wrap"],
  ["blockquote", "Blockquote"],
  ["em", "Em"],
  ["figcaption", "Figcaption"],
  ["list", "List"],
  ["strong", "Strong"],
  ["highlight", "Highlight"],
  ["mark", "Mark"],
  ["prose", "Prose"],
  ["codeblock", "Codeblock"],
  ["link", "Link"],
  ["text", "Text"],
  ["heading", "Heading"],
] as const

test("@a11y layout guide lists components and preserves legacy links", async ({
  page,
}) => {
  await page.goto("/docs/primitives", { waitUntil: "domcontentloaded" })
  await expect(page).toHaveURL(/\/docs\/layout$/)
  await expect(
    page.getByRole("heading", { name: "Layout and typography", level: 1 }),
  ).toBeVisible()

  for (const [slug, name] of components) {
    await expect(
      page.locator("article").getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", `/components/${slug}`)
  }

  await expect(
    page.getByRole("heading", { name: "Native semantics" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Style with StyleX" }),
  ).toHaveAttribute("href", "/docs/styling")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("layout section has no duplicate overview page", async ({ page }) => {
  await page.goto("/components", { waitUntil: "domcontentloaded" })
  await expect(page.locator('a[href="/components/layout"]')).toHaveCount(0)

  const sitemap = await page.request.get("/sitemap.xml")
  expect(await sitemap.text()).not.toContain("/components/layout")

  await page.goto("/docs/layout")
  await page.getByRole("link", { name: "Open live layout examples" }).click()
  await expect(page).toHaveURL(/\/docs\/layout#live-layout-examples$/)
  await expect(page.locator("#live-layout-examples")).toBeVisible()

  const response = await page.goto("/components/layout")
  expect(response?.status()).toBe(404)
})

test("@a11y styling guide offers copyable StyleX examples", async ({
  context,
  page,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/docs/styling", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: "Styling with StyleX", level: 1 }),
  ).toBeVisible()
  const code = page.getByTestId("copyable-code").first()
  const source = await code.locator("pre code").innerText()
  expect(source.trim()).not.toBe("")
  await code.getByRole("button", { name: "Copy Code", exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(source)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("@a11y lint guide offers copyable configuration", async ({
  context,
  page,
}) => {
  test.setTimeout(90_000)
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/docs/lint", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: "Lint rules", level: 1 }),
  ).toBeVisible()
  const article = page.locator("article")

  const configuration = article
    .getByTestId("copyable-code")
    .filter({ hasText: '"jsPlugins"' })
    .first()

  await configuration
    .getByRole("button", { name: "Copy Code", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(await configuration.locator("pre code").innerText())

  const config = z
    .object({
      jsPlugins: z.array(z.object({ name: z.string(), specifier: z.string() })),
      rules: z.record(z.string(), z.string()),
    })
    .parse(
      JSON.parse(await page.evaluate(() => navigator.clipboard.readText())),
    )

  expect(config.jsPlugins).toContainEqual({
    name: "yopem-ui",
    specifier: "@yopem-ui/oxlint-plugin",
  })
  expect(config.rules["yopem-ui/prefer-layout-primitives"]).toBe("error")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("@a11y guides stay readable and navigable at 320px", async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 320, height: 700 })

  for (const path of ["/docs/layout", "/docs/styling", "/docs/lint"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  }

  const searchButton = page.getByRole("button", {
    name: "Search documentation",
  })

  await expect(searchButton).toBeVisible()
  await expect(searchButton).toBeEnabled({ timeout: 30_000 })
  await page.getByRole("button", { name: "Open navigation" }).click()

  for (const name of [
    "Layout and typography",
    "Styling with StyleX",
    "Lint rules",
  ])
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible()
  await page
    .getByRole("link", { name: "Styling with StyleX", exact: true })
    .click()
  await expect(page).toHaveURL(/\/docs\/styling$/)
})

for (const [slug, name] of [
  ...components,
  ["checkmark", "Checkmark"],
  ["marquee", "Marquee"],
]) {
  test(`${name} has usage, a live preview and an API reference`, async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto(`/components/${slug}`, { waitUntil: "domcontentloaded" })
    await expect(
      page.getByRole("heading", { name, exact: true, level: 1 }),
    ).toBeVisible()
    await expect(page.getByLabel(/live preview$/).first()).toBeVisible()

    const copyUsage = page.getByRole("button", {
      name: new RegExp(`^Copy ${name} usage$`, "i"),
    })

    const usage = page
      .getByTestId("copyable-code")
      .filter({ has: copyUsage })
      .locator("pre code")

    const source = await usage.innerText()
    expect(source.trim()).not.toBe("")
    await copyUsage.click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(source)

    const reference = page
      .locator("details")
      .filter({
        has: page.locator("summary").filter({ hasText: "View API reference" }),
      })
      .first()

    await reference.locator("summary").first().click()
    const table = reference.getByRole("table").first()
    await expect(table).toBeVisible()
    await expect(
      table.getByRole("columnheader", { name: "Type", exact: true }),
    ).toBeVisible()
    await expect(table.getByRole("cell").first()).toBeVisible()
  })
}
