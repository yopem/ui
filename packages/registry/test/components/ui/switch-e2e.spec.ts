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

test("switch supports labels, pointer, keyboard, checked, controlled, and disabled states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-switch-1")
  const switchControl = page.getByRole("switch", { name: "Marketing emails" })
  await expect(switchControl).toHaveAttribute("aria-checked", "false")
  await switchControl.click()
  await expect(switchControl).toHaveAttribute("aria-checked", "true")
  await switchControl.focus()
  await switchControl.press("Space")
  await expect(switchControl).toHaveAttribute("aria-checked", "false")

  await openExample(page, "p-switch-2")
  await expect(page.getByRole("switch")).toBeDisabled()

  await openExample(page, "p-switch-3")
  await expect(
    page.getByRole("switch", { name: "Marketing emails" }),
  ).toHaveAttribute("aria-checked", "true")

  await openExample(page, "p-switch-4")
  const controlled = page.getByRole("switch", { name: "Enable notifications" })
  await expect(controlled).toHaveAttribute("aria-checked", "true")
  await page.getByText("Enable notifications", { exact: true }).click()
  await expect(controlled).toHaveAttribute("aria-checked", "false")

  await openExample(page, "p-switch-6")
  const customSwitch = page.getByRole("switch")
  const thumb = page.locator('[data-slot="switch-thumb"]')
  await expect(customSwitch).toBeVisible()
  await expect(thumb).toBeVisible()
  expectCleanPage()
})

test("@full-a11y switch passes axe in checked and unchecked states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-switch-1")
  const switchControl = page.getByRole("switch", { name: "Marketing emails" })
  await expectNoAxeViolations(page)
  await switchControl.click()
  await expect(switchControl).toHaveAttribute("aria-checked", "true")
  await expectNoAxeViolations(page)
  expectCleanPage()
})
