import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function monitorPage(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    const url = new URL(request.url())
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    const url = new URL(response.url())
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      response.status() >= 400 &&
      assets.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return function expectNoFailures() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page) {
  await page.goto("/examples/p-preview-card-1")
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const axe = new AxeBuilder({ page }).include("main[data-example-root]")
  if (await page.locator('[data-slot="preview-card-positioner"]').count())
    axe.include('[data-slot="preview-card-content"]')
  const results = await axe.analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 120_000 })

test("preview-card opens on pointer hover and closes after pointer leaves", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)

  const trigger = page.getByRole("button", { name: "coss.com/ui" })
  const popup = page.locator('[data-slot="preview-card-content"]')
  await expect(trigger).toBeVisible()
  await expect(popup).toBeHidden()
  await trigger.hover()
  await expect(popup).toBeVisible()
  await expect(
    popup.getByRole("heading", { level: 2, name: "coss.com/ui" }),
  ).toBeVisible()
  await expect(popup).toContainText(
    "Beautifully designed components that you can copy and paste into your apps.",
  )
  await expect(popup).toContainText("TypeScript")
  await expect(popup).toContainText("58.2k")
  await expect(popup).toContainText("5.1k")
  await page.mouse.move(0, 0)
  await expect(popup).toBeHidden()

  expectNoFailures()
})

test("preview-card opens from keyboard focus and returns to closed state", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)

  const trigger = page.getByRole("button", { name: "coss.com/ui" })
  const popup = page.locator('[data-slot="preview-card-content"]')
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await expect(popup).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()

  expectNoFailures()
})

test("@full-a11y preview-card passes axe closed and open", async ({ page }) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)
  await expectNoAxeViolations(page)

  await page.getByRole("button", { name: "coss.com/ui" }).hover()
  await expect(page.locator('[data-slot="preview-card-content"]')).toBeVisible()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
