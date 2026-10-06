import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

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
  ["bleed", "Bleed"],
  ["float", "Float"],
  ["wrap", "Wrap"],
  ["blockquote", "Blockquote"],
  ["em", "Em"],
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

test("@a11y styling guide teaches StyleX overrides", async ({ page }) => {
  await page.goto("/docs/styling", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: "Styling with StyleX", level: 1 }),
  ).toBeVisible()
  await expect(page.getByText(/stylex\.create/).first()).toBeVisible()
  await expect(page.getByText(/xstyle/).first()).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("@a11y lint guide offers copyable configuration", async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto("/docs/lint", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: "Lint rules", level: 1 }),
  ).toBeVisible()
  const article = page.locator("article")

  for (const rule of [
    "prefer-layout-primitives",
    "no-restyle",
    "enforce-styling-methods",
    "static-stylex",
    "no-raw-stylex-colors",
    "no-unused-stylex-styles",
    "atoms",
  ]) {
    await expect(
      article.getByRole("heading", { name: `yopem-ui/${rule}`, exact: true }),
    ).toBeVisible()
  }

  const copyButtons = article.getByRole("button", { name: "Copy Code" })

  expect(await copyButtons.count()).toBeGreaterThanOrEqual(14)
  await expect(copyButtons.first()).toBeEnabled({ timeout: 30_000 })
  await expect(article).not.toContainText("docs app")
  await expect(article).not.toContainText("Docs previews")
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
})

for (const [slug, name] of components) {
  test(`${name} has usage, a live preview and an API reference`, async ({
    page,
  }) => {
    await page.goto(`/components/${slug}`)
    await expect(
      page.getByRole("heading", { name, exact: true, level: 1 }),
    ).toBeVisible()
    await expect(page.getByLabel(/live preview$/).first()).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: new RegExp(`^Copy ${name} usage$`, "i"),
      }),
    ).toBeEnabled()
    await page
      .locator("summary")
      .filter({ hasText: "View API reference" })
      .click()
    await expect(
      page.getByRole("heading", {
        name: `${name.replaceAll(" ", "")}Props`,
        exact: true,
      }),
    ).toBeVisible()
  })
}
