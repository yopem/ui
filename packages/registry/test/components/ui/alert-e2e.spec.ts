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
  "p-alert-1",
  "p-alert-2",
  "p-alert-3",
  "p-alert-4",
  "p-alert-5",
  "p-alert-6",
  "p-alert-7",
] as const

test("alert renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="alert"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  const variants = [
    ["p-alert-1", "default"],
    ["p-alert-4", "info"],
    ["p-alert-5", "success"],
    ["p-alert-6", "warning"],
    ["p-alert-7", "error"],
  ] as const
  for (const [example, variant] of variants) {
    await openExample(page, example)
    await expect(page.getByRole("alert")).toHaveAttribute(
      "data-variant",
      variant,
    )
  }
  await openExample(page, "p-alert-3")
  const alert = page.getByRole("alert")
  await expect(alert.getByRole("button", { name: "Ok" })).toBeVisible()
  await expect(alert.locator('[data-slot="alert-title"]')).toHaveText(
    "Heads up!",
  )
  expect(failures).toEqual([])
})

test("@full-a11y alert examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="alert"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  expect(failures).toEqual([])
})
