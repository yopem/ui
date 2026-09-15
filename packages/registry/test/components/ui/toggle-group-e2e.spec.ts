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

test("toggle-group supports single, multiple, vertical, sized, outlined, and disabled states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toggle-group-1")
  const bold = page.getByRole("button", { name: "Toggle bold" })
  const italic = page.getByRole("button", { name: "Toggle italic" })
  await expect(bold).toHaveAttribute("aria-pressed", "true")
  await bold.focus()
  await bold.press("ArrowRight")
  await expect(italic).toBeFocused()
  await italic.press("Space")
  await expect(italic).toHaveAttribute("aria-pressed", "true")
  await expect(bold).toHaveAttribute("aria-pressed", "false")

  await openExample(page, "p-toggle-group-2")
  await expect(page.locator('[data-slot="toggle-group"]')).toHaveAttribute(
    "data-size",
    "sm",
  )

  await openExample(page, "p-toggle-group-3")
  await expect(page.locator('[data-slot="toggle-group"]')).toHaveAttribute(
    "data-size",
    "lg",
  )

  await openExample(page, "p-toggle-group-4")
  await expect(page.locator('[data-slot="toggle-group"]')).toHaveAttribute(
    "data-variant",
    "outline",
  )

  await openExample(page, "p-toggle-group-5")
  const vertical = page.locator('[data-slot="toggle-group"]')
  await expect(vertical).toHaveAttribute("data-orientation", "vertical")
  const verticalButtons = page.getByRole("button")
  await verticalButtons.first().focus()
  await verticalButtons.first().press("ArrowDown")
  await expect(verticalButtons.nth(1)).toBeFocused()
  await expect(page.getByRole("separator").first()).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  )

  await openExample(page, "p-toggle-group-6")
  for (const button of await page.getByRole("button").all()) {
    await expect(button).toBeDisabled()
  }

  await openExample(page, "p-toggle-group-7")
  await expect(
    page.getByRole("button", { name: "Toggle italic" }),
  ).toBeDisabled()
  await expect(page.getByRole("button", { name: "Toggle bold" })).toBeEnabled()

  await openExample(page, "p-toggle-group-8")
  const multipleBold = page.getByRole("button", { name: "Toggle bold" })
  const multipleItalic = page.getByRole("button", { name: "Toggle italic" })
  await multipleItalic.click()
  await expect(multipleBold).toHaveAttribute("aria-pressed", "true")
  await expect(multipleItalic).toHaveAttribute("aria-pressed", "true")
  expectCleanPage()
})

test("@full-a11y toggle-group passes axe in single and multiple selected states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toggle-group-1")
  await expectNoAxeViolations(page)
  await page.getByRole("button", { name: "Toggle italic" }).click()
  await expectNoAxeViolations(page)
  await openExample(page, "p-toggle-group-8")
  await page.getByRole("button", { name: "Toggle italic" }).click()
  await expectNoAxeViolations(page)
  expectCleanPage()
})
