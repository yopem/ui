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

test("sheet traps focus, restores focus, closes, and supports every side", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-sheet-1")
  const trigger = page.getByRole("button", { name: "Open Sheet" })
  await trigger.focus()
  await trigger.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Edit profile" })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator(":focus")).toHaveCount(1)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.getByRole("button", { name: "Close" }).click()
  await expect(dialog).toBeHidden()

  await openExample(page, "p-sheet-2")
  await page.getByRole("button", { name: "Open Sheet" }).click()
  await expect(page.locator('[data-slot="sheet-popup"]')).toHaveAttribute(
    "data-variant",
    "inset",
  )
  await page.keyboard.press("Escape")

  await openExample(page, "p-sheet-3")
  for (const side of ["Right", "Left", "Top", "Bottom"]) {
    await page.getByRole("button", { name: `Open ${side}` }).click()
    const sideDialog = page.getByRole("dialog", { name: side })
    await expect(sideDialog).toHaveAttribute("data-side", side.toLowerCase())
    await page.keyboard.press("Escape")
    await expect(sideDialog).toBeHidden()
  }
  expectCleanPage()
})

test("@full-a11y sheet passes axe before, during, and after modal state", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-sheet-1")
  await expectNoAxeViolations(page)
  await page.getByRole("button", { name: "Open Sheet" }).click()
  await expect(page.getByRole("dialog", { name: "Edit profile" })).toBeVisible()
  await expectNoAxeViolations(page)
  await page.keyboard.press("Escape")
  await expectNoAxeViolations(page)
  expectCleanPage()
})
