import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function openCalendarPreview(page: Page) {
  await page.goto("/components/calendar", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: /^Copy .* usage$/ }).first(),
  ).toBeEnabled()

  const calendar = page.locator('[data-slot="calendar"]')
  await expect(calendar).toBeVisible()

  return calendar
}

test("@a11y calendar labels include visible day numbers and pass axe", async ({
  page,
}) => {
  const calendar = await openCalendarPreview(page)
  const dayButtons = calendar.getByRole("button")

  for (let index = 0; index < (await dayButtons.count()); index += 1) {
    const dayButton = dayButtons.nth(index)
    const visibleDay = (await dayButton.innerText()).trim()

    if (!/^\p{N}+$/u.test(visibleDay)) continue

    const accessibleName = await dayButton.getAttribute("aria-label")
    const words = accessibleName?.match(/[\p{L}\p{N}]+/gu) ?? []

    expect(accessibleName).not.toBeNull()
    expect(
      words,
      `Visible day ${visibleDay} must be a word in its accessible name`,
    ).toContain(visibleDay)
  }

  const result = await new AxeBuilder({ page })
    .include('[data-slot="calendar"]')
    .analyze()

  expect(
    result.violations.map(({ help, id, nodes }) => ({
      help,
      id,
      targets: nodes.flatMap((node) => node.target),
    })),
  ).toEqual([])
})

test("calendar selects dates and keeps keyboard focus on the active day", async ({
  page,
}) => {
  const calendar = await openCalendarPreview(page)

  const secondDay = calendar.getByRole("button", {
    name: /January 2, 2026/u,
  })

  const thirdDay = calendar.getByRole("button", {
    name: /January 3, 2026/u,
  })

  await expect(secondDay).toHaveCount(1)
  await secondDay.click()
  await expect(secondDay).toBeFocused()
  await expect(secondDay).toHaveAttribute("aria-label", /selected/)
  await expect(secondDay.locator("xpath=..")).toHaveAttribute(
    "aria-selected",
    "true",
  )

  await page.keyboard.press("ArrowRight")
  await expect(thirdDay).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(thirdDay).toBeFocused()
  await expect(thirdDay).toHaveAttribute("aria-label", /selected/)
  await expect(thirdDay.locator("xpath=..")).toHaveAttribute(
    "aria-selected",
    "true",
  )
})
