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
  "p-group-1",
  "p-group-2",
  "p-group-3",
  "p-group-4",
  "p-group-5",
  "p-group-6",
  "p-group-7",
  "p-group-8",
  "p-group-9",
  "p-group-10",
  "p-group-11",
  "p-group-12",
  "p-group-13",
  "p-group-14",
  "p-group-15",
  "p-group-16",
  "p-group-17",
  "p-group-18",
  "p-group-19",
  "p-group-20",
  "p-group-22",
  "p-group-23",
] as const

test("group renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="group"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-group-1")
  const group = page.getByRole("group", { name: "File actions" })
  await expect(group.getByRole("button", { name: "Files" })).toBeVisible()
  const trigger = group.getByRole("button", { name: "Menu" })
  await trigger.press("Enter")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await menu.press("ArrowDown")
  await expect(menu).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeVisible()

  await openExample(page, "p-group-5")
  await expect(page.getByRole("button", { name: "Media" })).toBeDisabled()

  await openExample(page, "p-group-7")
  const domain = page.getByRole("textbox", { name: "Domain" })
  await domain.fill("example.com")
  await expect(domain).toHaveValue("example.com")
  expect(failures).toEqual([])
})

test("@full-a11y group examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="group"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-group-1")
  await page.getByRole("button", { name: "Menu" }).click()
  await expect(page.getByRole("menu")).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
