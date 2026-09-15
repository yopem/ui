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
  "p-avatar-1",
  "p-avatar-2",
  "p-avatar-3",
  "p-avatar-4",
  "p-avatar-5",
  "p-avatar-6",
  "p-avatar-7",
  "p-avatar-8",
  "p-avatar-9",
  "p-avatar-10",
  "p-avatar-11",
  "p-avatar-12",
  "p-avatar-13",
  "p-avatar-14",
] as const

test("avatar renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="avatar"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-avatar-1")
  const avatar = page.locator('[data-slot="avatar"]')
  await expect(avatar.locator('[data-slot="avatar-image"]')).toHaveAttribute(
    "alt",
    /.+/,
  )
  await expect(
    avatar
      .locator(
        '[data-slot="avatar-image"], [data-slot="avatar-fallback"]:visible',
      )
      .filter({ visible: true })
      .first(),
  ).toBeVisible()

  await openExample(page, "p-avatar-2")
  await expect(page.locator('[data-slot="avatar-fallback"]')).toHaveText("LT")

  await openExample(page, "p-avatar-13")
  await expect(page.locator('[data-slot="avatar"]')).toHaveCount(3)
  expect(failures).toEqual([])
})

test("@full-a11y avatar examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="avatar"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  expect(failures).toEqual([])
})
