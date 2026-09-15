import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const localAssetTypes = new Set(["font", "image", "script", "stylesheet"])

function trackFailures(page: Page) {
  const failures: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (
      localAssetTypes.has(request.resourceType()) &&
      page.url().startsWith("http") &&
      new URL(request.url()).origin === new URL(page.url()).origin
    ) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      localAssetTypes.has(response.request().resourceType()) &&
      page.url().startsWith("http") &&
      new URL(response.url()).origin === new URL(page.url()).origin
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })

  return failures
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.map(({ help, id, nodes }) => ({
      help,
      id,
      targets: nodes.flatMap(({ target }) => target),
    })),
  ).toEqual([])
}

test.describe("Sidebar docs re-export", () => {
  test("serves canonical source and public API without browser failures", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const failures = trackFailures(page)
    const response = await page.goto("/components/sidebar", {
      waitUntil: "domcontentloaded",
    })

    expect(response?.ok()).toBe(true)
    await expect(
      page.getByRole("heading", { level: 1, name: /^Sidebar$/i }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Copy src/components/ui/sidebar.tsx" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 2, name: "Examples" }),
    ).toBeVisible()
    await page.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(page)
    await expectNoAxeViolations(page)

    await page.getByText("View API reference", { exact: true }).click()
    await expect(
      page.getByRole("heading", { level: 3, name: "useSidebar", exact: true }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectNoAxeViolations(page)
    expect(failures).toEqual([])
  })

  test("documents Sidebar composition without inventing a nonexistent example", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const failures = trackFailures(page)
    const response = await page.goto("/components/sidebar", {
      waitUntil: "domcontentloaded",
    })

    expect(response?.ok()).toBe(true)
    await page.getByText("View API reference", { exact: true }).click()
    await expect(
      page.getByText(
        "Use the composition in Usage below to start with Sidebar.",
      ),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Copy Sidebar usage" }),
    ).toBeVisible()
    await expect(
      page.locator("pre").filter({ hasText: "SidebarProvider" }),
    ).toBeVisible()
    await expect(
      page.locator("pre").filter({ hasText: "SidebarTrigger" }),
    ).toBeVisible()
    await expect(
      page.locator("pre").filter({ hasText: "SidebarMenuButton" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", {
        exact: true,
        level: 3,
        name: "useSidebar",
      }),
    ).toBeVisible()
    await expectNoAxeViolations(page)
    await expectNoHorizontalOverflow(page)
    expect(failures).toEqual([])
  })
})
