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
  ["link", "Link"],
  ["paragraph", "Paragraph"],
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
    page.getByRole("link", { name: "Learn style props" }),
  ).toHaveAttribute("href", "/docs/style-props")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("style props guide covers shared styling and advanced reference", async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto("/docs/style-props")
  await expect(
    page.getByRole("heading", { name: "Style props", level: 1 }),
  ).toBeVisible()
  await expect(page.getByText(/Button and Input/)).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Responsive and state styles" }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page
    .locator("summary")
    .filter({ hasText: "All styling aliases" })
    .click()
  await expect(
    page
      .getByRole("table", { name: "Styling aliases" })
      .getByRole("cell", { name: "ps", exact: true }),
  ).toBeVisible()
  await page
    .locator("summary")
    .filter({ hasText: "All state and media conditions" })
    .click()
  await expect(
    page
      .getByRole("table", { name: "Style conditions" })
      .getByRole("cell", { name: "_moreContrast", exact: true }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("lint guide offers copyable configuration", async ({ page }) => {
  await page.goto("/docs/lint")
  await expect(
    page.getByRole("heading", { name: "Lint rules", level: 1 }),
  ).toBeVisible()
  const copyButtons = page.getByRole("button", { name: "Copy Code" })
  await expect(copyButtons).toHaveCount(2)
  await expect(copyButtons.first()).toBeEnabled()
  await expect(copyButtons.last()).toBeEnabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("guides stay readable and navigable at 320px", async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 320, height: 700 })
  for (const path of ["/docs/layout", "/docs/style-props", "/docs/lint"]) {
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
  for (const name of ["Layout and typography", "Style props", "Lint rules"])
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
      page.getByRole("heading", { name: `${name}Props`, exact: true }),
    ).toBeVisible()
  })
}
