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

test("tooltip opens from pointer and keyboard, closes, and swaps shared content", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-tooltip-1")
  const trigger = page.getByRole("button", { name: "Hover" })
  await trigger.hover()
  const popup = page.locator('[data-slot="tooltip-popup"]')
  await expect(popup).toContainText("Helpful hint")
  const portal = page.locator(
    '[data-base-ui-portal]:has([data-slot="tooltip-popup"])',
  )
  await expect(portal).toHaveAttribute("role", "region")
  await expect(portal).toHaveAccessibleName("Tooltip")
  await page.mouse.move(0, 0)
  await expect(popup).toBeHidden()
  await trigger.focus()
  await expect(popup).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()

  await openExample(page, "p-tooltip-3")
  const sharedPopup = page.locator('[data-slot="tooltip-popup"]')
  await page.getByRole("button", { name: "Toggle bold" }).hover()
  await expect(sharedPopup).toContainText("Make text bold")
  await page.getByRole("button", { name: "Toggle italic" }).hover()
  await expect(sharedPopup).toContainText("Apply italic formatting to text")
  await page.mouse.move(0, 0)
  await page.getByRole("button", { name: "Toggle underline" }).focus()
  await expect(sharedPopup).toContainText("Underline text")

  await openExample(page, "p-tooltip-4")
  await page.getByRole("button", { name: "Share via email" }).hover()
  await expect(page.locator('[data-slot="tooltip-popup"]')).toContainText(
    "Share via email",
  )
  await expect(
    page.locator('[data-slot="tooltip-positioner"]'),
  ).toHaveAttribute("data-side", "right")
  expectCleanPage()
})

test("@full-a11y tooltip passes axe in hover and focus-open states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-tooltip-1")
  await expectNoAxeViolations(page)
  const trigger = page.getByRole("button", { name: "Hover" })
  await trigger.hover()
  await expect(page.locator('[data-slot="tooltip-popup"]')).toBeVisible()
  await expectNoAxeViolations(page)
  await page.mouse.move(0, 0)
  await trigger.focus()
  await expect(page.locator('[data-slot="tooltip-popup"]')).toBeVisible()
  await expectNoAxeViolations(page)
  expectCleanPage()
})
