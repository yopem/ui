import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const examples = Array.from({ length: 9 }, (_, index) => `p-menu-${index + 1}`)

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function monitorPage(page: Page) {
  const failures: string[] = []
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
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      isLocalUrl(response.url()) &&
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

async function openExample(page: Page, example: string) {
  await page.goto(`/examples/${example}`)
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const axe = new AxeBuilder({ page }).include("main[data-example-root]")
  if (await page.locator('[data-slot="menu-positioner"]').count())
    axe.include('[data-slot="menu-popup"]')
  const results = await axe.analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 240_000 })

test("menu examples render every trigger variant cleanly", async ({ page }) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expect(page.locator('[data-slot="menu-trigger"]')).toBeVisible()
  }

  expectNoFailures()
})

test("menu keyboard navigation includes disabled items and restores focus", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-menu-1")

  const trigger = page.getByRole("button", { name: "Open menu" })
  await trigger.focus()
  await trigger.press("Enter")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(page.getByRole("menuitem", { name: /^Play / })).toBeFocused()

  await page.keyboard.press("ArrowDown")
  const pause = page.getByRole("menuitem", { name: /^Pause / })
  await expect(pause).toBeFocused()
  await expect(pause).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("menuitem", { name: /Previous/ })).toBeFocused()

  await page.keyboard.press("End")
  await expect(page.getByRole("menuitem", { name: /Delete/ })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(trigger).toBeFocused()

  expectNoFailures()
})

test("menu checkbox, radio, switch, submenu, and close states respond", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-menu-3")
  await page.getByRole("button", { name: "Open menu" }).click()
  const notifications = page.getByRole("menuitemcheckbox", {
    name: "Notifications",
  })
  await expect(notifications).toHaveAttribute("aria-checked", "false")
  await notifications.click()
  await expect(notifications).toHaveAttribute("aria-checked", "true")

  await openExample(page, "p-menu-4")
  await page.getByRole("button", { name: "Open menu" }).click()
  const dark = page.getByRole("menuitemradio", { name: "Dark" })
  await dark.click()
  await expect(dark).toHaveAttribute("aria-checked", "true")

  await openExample(page, "p-menu-7")
  await page.getByRole("button", { name: "Open menu" }).click()
  const more = page.getByRole("menuitem", { name: "More" })
  await more.hover()
  const submenu = page.getByRole("menu").nth(1)
  await expect(submenu).toBeVisible()
  await expect(page.getByRole("menuitem", { name: "Sub item A" })).toBeVisible()

  await openExample(page, "p-menu-8")
  const closeTrigger = page.getByRole("button", { name: "Open menu" })
  await closeTrigger.click()
  await page.getByRole("menuitem", { name: "Profile" }).click()
  await expect(page.getByRole("menu")).toBeHidden()
  await expect(closeTrigger).toBeFocused()

  await openExample(page, "p-menu-9")
  await page.getByRole("button", { name: "Open menu" }).click()
  const autoSave = page.getByRole("menuitemcheckbox", { name: "Auto save" })
  await expect(autoSave).toHaveAttribute("data-variant", "switch")
  await expect(autoSave).toHaveAttribute("aria-checked", "true")
  await autoSave.click()
  await expect(autoSave).toHaveAttribute("aria-checked", "false")

  expectNoFailures()
})

test("hover menu opens and closes with pointer movement", async ({ page }) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-menu-2")

  const trigger = page.getByRole("button", { name: "Hover me" })
  await trigger.hover()
  await expect(page.getByRole("menu")).toBeVisible()
  await expect(page.getByRole("menuitem", { name: "Item one" })).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(page.getByRole("menu")).toBeHidden()

  expectNoFailures()
})

test("@full-a11y menu examples pass axe closed, open, and changed", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expectNoAxeViolations(page)
    await page.locator('[data-slot="menu-trigger"]').click()
    await expect(page.getByRole("menu").first()).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-menu-9")
  await page.getByRole("button", { name: "Open menu" }).click()
  await page.getByRole("menuitemcheckbox", { name: "Notifications" }).click()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
