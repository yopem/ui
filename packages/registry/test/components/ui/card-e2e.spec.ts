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
  "p-card-1",
  "p-card-2",
  "p-card-3",
  "p-card-4",
  "p-card-5",
  "p-card-6",
  "p-card-7",
  "p-card-8",
  "p-card-9",
  "p-card-10",
  "p-card-11",
] as const

test("card renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator(':is([data-slot="card"], [data-slot="card-frame"])')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-card-1")
  const card = page.locator('[data-slot="card"]')
  await expect(card.locator('[data-slot="card-header"]')).toContainText(
    "Create project",
  )
  await expect(card.locator('[data-slot="card-panel"]')).toBeVisible()
  await expect(card.locator('[data-slot="card-footer"]')).toContainText(
    "few seconds",
  )
  await card.getByRole("textbox", { name: "Name" }).focus()
  await expect(card.getByRole("textbox", { name: "Name" })).toBeFocused()

  await openExample(page, "p-card-4")
  const cardFrame = page.locator('[data-slot="card-frame"]')
  await expect(cardFrame).toBeVisible()
  await expect(
    cardFrame.locator('[data-slot="card-frame-footer"]'),
  ).toContainText("few seconds")
  expect(failures).toEqual([])
})

test("@full-a11y card examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator(':is([data-slot="card"], [data-slot="card-frame"])')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  expect(failures).toEqual([])
})
