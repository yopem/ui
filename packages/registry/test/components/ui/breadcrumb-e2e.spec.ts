import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const assetTypes = new Set(["font", "image", "script", "stylesheet"])

function captureFailures(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (
      /localhost|127\.0\.0\.1/.test(request.url()) &&
      assetTypes.has(request.resourceType())
    ) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      /localhost|127\.0\.0\.1/.test(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return failures
}

async function openExample(page: Page, example: string) {
  await page.goto(`/examples/${example}`, { waitUntil: "domcontentloaded" })
  const root = page.locator("[data-example-root]")
  await expect(root).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

const examples = [
  "p-breadcrumb-1",
  "p-breadcrumb-2",
  "p-breadcrumb-3",
  "p-breadcrumb-4",
  "p-breadcrumb-5",
  "p-breadcrumb-6",
  "p-breadcrumb-7",
] as const

test("breadcrumb renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator('[data-slot="breadcrumb"]')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-breadcrumb-7")
  await expect(
    page.getByRole("combobox", { name: "Select database" }),
  ).toBeVisible()

  await openExample(page, "p-breadcrumb-1")
  const navigation = page.getByRole("navigation", { name: "breadcrumb" })
  await expect(navigation.getByRole("link", { name: "Home" })).toBeVisible()
  await expect(navigation.locator('[aria-current="page"]')).toHaveText(
    "Breadcrumb",
  )
  const trigger = page.getByRole("button", { name: "More pages" })
  await trigger.press("Enter")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  const portal = page.locator(
    '[data-base-ui-portal]:has([data-slot="menu-popup"])',
  )
  await expect(portal).toHaveAttribute("role", "region")
  await expect(portal).toHaveAccessibleName("Menu")
  await menu.press("ArrowDown")
  await expect(menu).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(menu.getByRole("menuitem", { name: "Examples" })).toBeVisible()
  expect(failures).toEqual([])
})

test("@full-a11y breadcrumb examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator('[data-slot="breadcrumb"]')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-breadcrumb-1")
  await page.getByRole("button", { name: "More pages" }).click()
  await expect(page.getByRole("menu")).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
