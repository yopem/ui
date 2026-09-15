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

test("select supports keyboard, pointer, sizes, and disabled triggers", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)

  await openExample(page, "p-select-1")
  const trigger = page.getByRole("combobox", { name: "Select framework" })
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await trigger.press("Enter")
  const listbox = page.getByRole("listbox")
  await expect(listbox).toBeVisible()
  const portal = page.locator(
    '[data-base-ui-portal]:has([data-slot="select-popup"])',
  )
  await expect(portal).toHaveAttribute("role", "region")
  await expect(portal).toHaveAccessibleName("Select framework options")
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(trigger).toContainText("Vite")
  await trigger.click()
  await page.getByRole("option", { name: "Astro" }).click()
  await expect(trigger).toContainText("Astro")

  const heights: number[] = []
  for (const example of ["p-select-2", "p-select-1", "p-select-3"]) {
    await openExample(page, example)
    const box = await page.getByRole("combobox").boundingBox()
    expect(box).not.toBeNull()
    heights.push(box?.height ?? 0)
  }
  expect(heights[0]).toBeLessThan(heights[1] ?? 0)
  expect(heights[1]).toBeLessThan(heights[2] ?? 0)

  await openExample(page, "p-select-4")
  await expect(page.getByRole("combobox")).toBeDisabled()
  expectCleanPage()
})

test("select supports groups, multiple values, disabled options, labels, and invalid state", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-select-6")
  await page.getByRole("combobox").click()
  await expect(page.getByText("Frontend", { exact: true })).toBeVisible()
  await expect(page.getByText("Backend", { exact: true })).toBeVisible()
  await expect(page.locator('[data-slot="select-separator"]')).toBeVisible()
  await page.keyboard.press("Escape")

  await openExample(page, "p-select-7")
  const multiple = page.getByRole("combobox")
  await multiple.click()
  await expect(
    page.getByRole("option", { name: "JavaScript" }),
  ).toHaveAttribute("aria-selected", "true")
  await page.getByRole("option", { name: "Rust" }).click()
  await expect(multiple).toContainText("+2 more")
  await page.keyboard.press("Escape")

  await openExample(page, "p-select-12")
  await page.getByRole("combobox").click()
  await expect(
    page.getByRole("option", { name: "Astro (coming soon)" }),
  ).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("Escape")

  await openExample(page, "p-select-11")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByRole("combobox")).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await expect(page.getByText("Please select a value.")).toBeVisible()

  await openExample(page, "p-select-23")
  await expect(page.locator('[data-slot="select-label"]')).toHaveText("Fruits")
  expectCleanPage()
})

test("@full-a11y select passes axe when closed, open, selected, and invalid", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-select-1")
  await expectNoAxeViolations(page)
  const trigger = page.getByRole("combobox", { name: "Select framework" })
  await trigger.click()
  await expect(page.getByRole("listbox")).toBeVisible()
  await expectNoAxeViolations(page)
  await page.getByRole("option", { name: "Vite" }).click()
  await expectNoAxeViolations(page)

  await openExample(page, "p-select-11")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByRole("combobox")).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await expectNoAxeViolations(page)
  expectCleanPage()
})
