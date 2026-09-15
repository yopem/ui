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
  "p-context-menu-1",
  "p-context-menu-2",
  "p-context-menu-3",
  "p-context-menu-4",
  "p-context-menu-5",
  "p-context-menu-6",
  "p-context-menu-7",
  "p-context-menu-8",
] as const

test("context-menu renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator('[data-slot="context-menu-trigger"]')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-context-menu-1")
  const trigger = page.locator('[data-slot="context-menu-trigger"]')
  await trigger.click({ button: "right" })
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  const portal = page.locator(
    '[data-base-ui-portal]:has([data-slot="context-menu-popup"])',
  )
  await expect(portal).toHaveAttribute("role", "region")
  await expect(portal).toHaveAccessibleName("Context menu")
  const items = menu.getByRole("menuitem")
  await items.first().focus()
  await expect(items.first()).toBeFocused()
  await page.keyboard.press("ArrowDown")
  await expect(items.nth(1)).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(menu).toBeHidden()

  await openExample(page, "p-context-menu-3")
  await page.locator('[data-slot="context-menu-trigger"]').click({
    button: "right",
  })
  const share = page.getByRole("menuitem", { name: "Share" })
  await share.hover()
  await expect(page.getByRole("menuitem", { name: "Email link" })).toBeVisible()
  await page.keyboard.press("Escape")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toHaveCount(0)

  await openExample(page, "p-context-menu-7")
  await page.locator('[data-slot="context-menu-trigger"]').click({
    button: "right",
  })
  const dark = page.getByRole("menuitemradio", { name: "Dark" })
  await dark.click()
  await expect(dark).toBeChecked()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toBeHidden()
  expect(failures).toEqual([])
})

test("@full-a11y context-menu examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    const trigger = page
      .locator('[data-slot="context-menu-trigger"]')
      .filter({ visible: true })
      .first()
    await expect(trigger).toBeVisible()
    await expectNoAxeViolations(page)
    await trigger.click({ button: "right" })
    await expect(page.getByRole("menu")).toBeVisible()
    await expectNoAxeViolations(page)
    await page.keyboard.press("Escape")
    await expect(page.getByRole("menu")).toBeHidden()
  }

  await openExample(page, "p-context-menu-3")
  await page.locator('[data-slot="context-menu-trigger"]').click({
    button: "right",
  })
  await page.getByRole("menuitem", { name: "Share" }).hover()
  await expect(page.getByRole("menuitem", { name: "Email link" })).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
