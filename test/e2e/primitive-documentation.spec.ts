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

test("primitive guide covers shared APIs and lint setup", async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto("/docs/primitives")
  await expect(
    page.getByRole("heading", { name: "Layout and typography", level: 1 }),
  ).toBeVisible()
  for (const [slug, name] of components) {
    await expect(
      page
        .getByRole("table", { name: "Primitive reference" })
        .getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", `/components/${slug}`)
  }
  await expect(
    page.getByRole("heading", { name: "Style props", exact: true }),
  ).toBeVisible()
  await expect(page.getByText("Spacing:", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Responsive and state styles" }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Lint rule" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy .oxlintrc.json", exact: true }),
  ).toBeEnabled()
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

test("guide remains readable and searchable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto("/docs/primitives")
  await expect(
    page.getByRole("heading", { name: "Style props", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Search documentation" }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320)
  await page.getByRole("button", { name: "Open navigation" }).click()
  await expect(
    page.getByRole("link", { name: "Layout and style props" }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

for (const [slug, name] of components) {
  test(`${name} has usage, a live example and an API reference`, async ({
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
