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
  const results = await new AxeBuilder({ page })
    .exclude("[data-base-ui-focus-guard]")
    .analyze()
  expect(results.violations).toEqual([])
}

test("toolbar supports roving focus, toggles, tooltips, select, and pointer actions", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toolbar-1")
  const toolbar = page.getByRole("toolbar")
  await expect(toolbar).toBeVisible()
  await expect(toolbar.getByRole("separator")).toHaveCount(3)

  const alignLeft = page.getByRole("button", { name: "Align left" })
  const alignCenter = page.getByRole("button", { name: "Toggle center" })
  await expect(alignLeft).toHaveAttribute("aria-pressed", "true")
  await alignLeft.focus()
  await alignLeft.press("ArrowRight")
  await expect(alignCenter).toBeFocused()
  await alignCenter.press("Space")
  await expect(alignCenter).toHaveAttribute("aria-pressed", "true")

  const currency = page.getByRole("button", { name: "Format as currency" })
  await currency.hover()
  await expect(page.locator('[data-slot="tooltip-popup"]')).toContainText(
    "Format as currency",
  )

  const font = page.getByRole("combobox", { name: "Select font" })
  await font.focus()
  await font.press("Enter")
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.getByRole("option", { name: "Arial" }).click()
  await expect(font).toContainText("Arial")

  const save = page.getByRole("button", { name: "Save" })
  await save.click()
  await expect(save).toBeVisible()
  expectCleanPage()
})

test("@full-a11y toolbar passes axe with tooltip and select popup open", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toolbar-1")
  await expectNoAxeViolations(page)
  await page.getByRole("button", { name: "Format as percent" }).hover()
  await expect(page.locator('[data-slot="tooltip-popup"]')).toBeVisible()
  await expectNoAxeViolations(page)
  await page.mouse.move(0, 0)
  const font = page.getByRole("combobox", { name: "Select font" })
  await font.click()
  await expect(page.getByRole("listbox")).toBeVisible()
  await expectNoAxeViolations(page)
  expectCleanPage()
})
