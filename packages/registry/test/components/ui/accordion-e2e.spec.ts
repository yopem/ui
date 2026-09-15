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
  "p-accordion-1",
  "p-accordion-2",
  "p-accordion-3",
  "p-accordion-4",
] as const

test("accordion renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="accordion"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-accordion-1")
  await expect(
    page.getByRole("heading", { level: 2, name: "Component preview" }),
  ).toBeAttached()
  const triggers = page.locator('[data-slot="accordion-trigger"]')
  await expect(triggers).toHaveCount(3)
  await expect(triggers.nth(2)).toHaveAttribute("aria-expanded", "true")
  await triggers.first().click()
  await expect(triggers.first()).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText("Base UI is a library")).toBeVisible()
  await triggers.first().press("Tab")
  await expect(triggers.nth(1)).toBeFocused()
  await triggers.nth(1).press("Enter")
  await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true")

  await openExample(page, "p-accordion-4")
  await page.getByRole("button", { name: "Open First Two" }).click()
  await expect(page.getByText("Open items: item-1, item-2")).toBeVisible()
  await expect(
    page.locator('[data-slot="accordion-trigger"][aria-expanded="true"]'),
  ).toHaveCount(2)
  expect(failures).toEqual([])
})

test("@full-a11y accordion examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="accordion"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-accordion-3")
  const trigger = page.getByRole("button", { name: "What is Base UI?" })
  await trigger.press("Enter")
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
