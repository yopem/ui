import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe.configure({ timeout: 120_000 })

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function watchPage(page: Page) {
  const failures: string[] = []
  const assetTypes = new Set(["font", "image", "script", "stylesheet"])

  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (isLocalUrl(request.url())) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })

  return function expectCleanPage() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, name: string) {
  await page.goto(`/examples/${name}`)
  await expect(page.locator("[data-example-root]")).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(viewportFits).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test("toast supports types, actions, async anchored errors, and id deduplication", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toast-2")
  const cases = [
    ["Success Toast", "Success!", "success"],
    ["Error Toast", "Uh oh! Something went wrong.", "error"],
    ["Info Toast", "Heads up!", "info"],
    ["Warning Toast", "Warning!", "warning"],
  ] as const
  for (const [buttonName, title, type] of cases) {
    await page.getByRole("button", { name: buttonName }).click()
    await expect(
      page.locator('[data-slot="toast-title"]').filter({ hasText: title }),
    ).toBeVisible()
    await expect(page.locator(`[data-toast-type="${type}"]`)).toBeVisible()
  }

  await openExample(page, "p-toast-3")
  await page.getByRole("button", { name: "Loading Toast" }).click()
  await expect(page.getByText("Loading…", { exact: true })).toBeVisible()
  await expect(page.locator('[data-toast-type="loading"]')).toBeVisible()

  await openExample(page, "p-toast-4")
  await page.getByRole("button", { name: "Perform Action" }).click()
  await expect(
    page.getByText("Action performed", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(page.getByText("Action undone", { exact: true })).toBeVisible()

  await openExample(page, "p-toast-8")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByRole("button", { name: /Submitting…/ })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled({
    timeout: 3_000,
  })

  await openExample(page, "p-toast-10")
  const dedup = page.getByRole("button", { name: "One Success Toast" })
  await dedup.click()
  await dedup.click()
  await expect(
    page.locator('[data-slot="toast-root"]').filter({ hasText: "Saved" }),
  ).toHaveCount(1)
  await expect(page.getByText("Saved", { exact: true })).toBeVisible()
  expectCleanPage()
})

test("@full-a11y toast passes axe after creation and action state changes", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toast-1")
  await expectNoAxeViolations(page)
  await page.getByRole("button", { name: "Default Toast" }).click()
  await expect(
    page.getByText("Event has been created", { exact: true }),
  ).toBeVisible()
  await expectNoAxeViolations(page)

  await openExample(page, "p-toast-4")
  await page.getByRole("button", { name: "Perform Action" }).click()
  await expectNoAxeViolations(page)
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(page.getByText("Action undone", { exact: true })).toBeVisible()
  await expectNoAxeViolations(page)
  expectCleanPage()
})
