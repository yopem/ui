import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function monitorPage(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    const url = new URL(request.url())
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    const url = new URL(response.url())
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      response.status() >= 400 &&
      assets.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return function expectNoFailures() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page) {
  await page.goto("/examples/p-autocomplete-5")
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

test("label renders as label and focuses its associated control", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)

  const label = page.getByText("Fruits", { exact: true })
  const input = page.getByRole("combobox", { name: "Search items" })
  await expect(label).toHaveJSProperty("tagName", "LABEL")
  const inputId = await input.getAttribute("id")
  expect(inputId).not.toBeNull()
  await expect(label).toHaveAttribute("for", inputId ?? "")
  await label.click()
  await expect(input).toBeFocused()
  await input.fill("app")
  await expect(page.getByRole("listbox")).toBeVisible()
  await expect(page.getByRole("option", { name: /Apple/ })).toBeVisible()
  await input.press("Escape")
  await expect(page.getByRole("listbox")).toBeHidden()

  expectNoFailures()
})

test("@full-a11y label association and open autocomplete pass axe", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)

  const initial = await new AxeBuilder({ page }).analyze()
  expect(initial.violations).toEqual([])

  await page.getByText("Fruits", { exact: true }).click()
  await page.getByRole("combobox", { name: "Search items" }).fill("a")
  await expect(page.getByRole("listbox")).toBeVisible()
  const open = await new AxeBuilder({ page })
    .include("main[data-example-root]")
    .include('[data-slot="autocomplete-popup"]')
    .analyze()
  expect(open.violations).toEqual([])

  expectNoFailures()
})
