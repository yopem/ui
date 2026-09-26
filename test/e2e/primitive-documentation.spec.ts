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

test("layout guide lists components and preserves legacy links", async ({
  page,
}) => {
  await page.goto("/docs/primitives")
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

test("styling guide teaches StyleX overrides", async ({ page }) => {
  await page.goto("/docs/styling")
  await expect(
    page.getByRole("heading", { name: "Styling with StyleX", level: 1 }),
  ).toBeVisible()
  await expect(page.getByText(/stylex\.create/).first()).toBeVisible()
  await expect(page.getByText(/xstyle/).first()).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("lint guide offers copyable configuration", async ({ page }) => {
  await page.goto("/docs/lint")
  await expect(
    page.getByRole("heading", { name: "Lint rules", level: 1 }),
  ).toBeVisible()
  const copyButtons = page.getByRole("button", { name: "Copy Code" })
  await expect(copyButtons.first()).toBeEnabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("guides stay readable and navigable at 320px", async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 320, height: 700 })
  for (const path of ["/docs/layout", "/docs/styling", "/docs/lint"]) {
    await page.goto(path)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  }
  await expect(
    page.getByRole("button", { name: "Search documentation" }),
  ).toBeVisible()
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
