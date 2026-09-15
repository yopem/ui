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

test.describe("Toggle Group docs re-export", () => {
  test("serves canonical source and public API without browser failures", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const failures = trackFailures(page)
    const response = await page.goto("/components/toggle-group", {
      waitUntil: "domcontentloaded",
    })

    expect(response?.ok()).toBe(true)
    await expect(
      page.getByRole("heading", { level: 1, name: /^Toggle\sGroup$/i }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", {
        name: "Copy src/components/ui/toggle-group.tsx",
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
      page.getByRole("heading", { level: 3, name: "ToggleGroup", exact: true }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await expectNoAxeViolations(page)
    expect(failures).toEqual([])
  })

  test("renders p-toggle-group-1 with component-specific behavior and accessibility", async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const failures = trackFailures(page)
    await page.emulateMedia({ reducedMotion: "reduce" })
    const response = await page.goto("/examples/p-toggle-group-1?theme=light", {
      waitUntil: "domcontentloaded",
    })

    expect(response?.ok()).toBe(true)
    await expect(page).toHaveURL("/examples/p-toggle-group-1?theme=light")
    await expect(
      page.getByRole("heading", { level: 1, name: "p-toggle-group-1" }),
    ).toBeAttached()
    await expect(
      page.locator('[data-example-root][data-theme="light"]'),
    ).toBeVisible()
    await expect(
      page.getByText("Loading example…", { exact: true }),
    ).toHaveCount(0)
    await page.waitForLoadState("networkidle")
    const group = page.locator('[data-slot="toggle-group"]')
    const bold = page.getByRole("button", { name: "Toggle bold" })
    const italic = page.getByRole("button", { name: "Toggle italic" })
    await expect(group).toHaveAttribute("data-orientation", "horizontal")
    await expect(bold).toHaveAttribute("aria-pressed", "true")
    await expect(italic).toHaveAttribute("aria-pressed", "false")
    await expectNoAxeViolations(page)
    await italic.focus()
    await italic.press("Space")
    await expect(italic).toBeFocused()
    await expect(italic).toHaveAttribute("aria-pressed", "true")
    await expect(bold).toHaveAttribute("aria-pressed", "false")
    await expectNoAxeViolations(page)
    await expectNoHorizontalOverflow(page)
    expect(failures).toEqual([])
  })
})
