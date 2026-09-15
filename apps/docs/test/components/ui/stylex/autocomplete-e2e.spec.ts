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

test.describe("Autocomplete docs re-export", () => {
  test("serves canonical source and public API without browser failures", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const failures = trackFailures(page)
    const response = await page.goto("/components/autocomplete", {
      waitUntil: "domcontentloaded",
    })

    expect(response?.ok()).toBe(true)
    await expect(
      page.getByRole("heading", { level: 1, name: /^Autocomplete$/i }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Copy src/components/ui/autocomplete.tsx",
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { level: 2, name: "Examples" }),
    ).toBeVisible()
    await page.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(page)
    await expectNoAxeViolations(page)

    await page.getByText("View API reference", { exact: true }).click()
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "AutocompletePopup",
        exact: true,
      }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectNoAxeViolations(page)
    expect(failures).toEqual([])
  })

  test("renders p-autocomplete-1 with component-specific behavior and accessibility", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const failures = trackFailures(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    const response = await page.goto("/examples/p-autocomplete-1?theme=light", {
      waitUntil: "domcontentloaded",
    })

    expect(response?.ok()).toBe(true)
    await expect(page).toHaveURL("/examples/p-autocomplete-1?theme=light")
    await expect(
      page.getByRole("heading", { level: 1, name: "p-autocomplete-1" }),
    ).toBeAttached()
    await expect(
      page.locator('[data-example-root][data-theme="light"]'),
    ).toBeVisible()
    await expect(
      page.getByText("Loading example…", { exact: true }),
    ).toHaveCount(0)
    await page.waitForLoadState("networkidle")
    const input = page.getByRole("combobox", { name: "Search items" })
    await expect(input).toHaveAttribute("placeholder", "Search items…")
    await expectNoAxeViolations(page)
    await input.focus()
    await input.fill("ban")
    const option = page.getByRole("option", { name: "Banana" })
    await expect(option).toBeVisible()
    await expect(page.locator('[data-slot="autocomplete-popup"]')).toBeVisible()
    await expectNoAxeViolations(page)
    await input.press("ArrowDown")
    await input.press("Enter")
    await expect(input).toHaveValue("Banana")
    await expect(input).toBeFocused()
    await expectNoHorizontalOverflow(page)
    expect(failures).toEqual([])
  })
})
