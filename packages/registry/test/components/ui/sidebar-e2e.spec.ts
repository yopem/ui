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

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test("sidebar documentation serves canonical source and stays responsive", async ({
  page,
  request,
}) => {
  const expectCleanPage = watchPage(page)
  const registryResponse = await request.get("/r/sidebar.json")
  expect(registryResponse.ok()).toBe(true)
  const registrySource = await registryResponse.text()
  expect(registrySource).toContain("sidebar.tsx")
  expect(registrySource).toContain("SidebarProvider")
  expect(registrySource).toContain("SidebarTrigger")

  await page.goto("/components/sidebar")
  await expect(
    page.getByRole("heading", { name: "Sidebar", level: 1 }),
  ).toBeVisible()
  await expect(page.getByText(/Use the composition in Usage/)).toBeVisible()
  await expect(page.locator("body")).toContainText("SidebarProvider")
  const apiSummary = page.getByText("View API reference", { exact: true })
  const apiDetails = page.locator("details").filter({ has: apiSummary })
  await apiSummary.focus()
  await apiSummary.press("Enter")
  await expect(apiDetails).toHaveAttribute("open", "")
  await expect(apiDetails).toContainText("SidebarProvider")
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
  expectCleanPage()
})

test("@full-a11y sidebar documentation passes axe before and after API expansion", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await page.goto("/components/sidebar")
  await expect(
    page.getByRole("heading", { name: "Sidebar", level: 1 }),
  ).toBeVisible()
  await expectNoAxeViolations(page)
  const apiSummary = page.getByText("View API reference", { exact: true })
  const apiDetails = page.locator("details").filter({ has: apiSummary })
  await apiSummary.click()
  await expect(apiDetails).toHaveAttribute("open", "")
  await expect(apiDetails).toContainText("SidebarProvider")
  await expectNoAxeViolations(page)
  expectCleanPage()
})
