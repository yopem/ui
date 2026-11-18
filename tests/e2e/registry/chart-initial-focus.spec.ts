import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("chart initial focus survives Strict Mode and stays dismissed after updates", async ({
  page,
}) => {
  await openPreview(page, "chart")

  const example = page.getByRole("region", {
    name: "First initial focus",
    exact: true,
  })

  await example
    .getByRole("button", { name: "Show first chart", exact: true })
    .click()
  const tooltip = page.getByRole("status").filter({ hasText: "First series" })
  await expect(tooltip).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(tooltip).toBeHidden()
  await example
    .getByRole("button", { name: "Update first data", exact: true })
    .click()
  await expect(tooltip).toBeHidden()
})

test("chart initial focus waits until its scene point exists", async ({
  page,
}) => {
  await openPreview(page, "chart")

  const example = page.getByRole("region", {
    name: "Deferred initial focus",
    exact: true,
  })

  await example
    .getByRole("button", { name: "Show deferred chart", exact: true })
    .click()

  const tooltip = page
    .getByRole("status")
    .filter({ hasText: "Deferred series" })

  await expect(tooltip).toBeHidden()
  await example
    .getByRole("button", { name: "Load remaining points", exact: true })
    .click()
  await expect(tooltip).toBeVisible()
  await expect(tooltip.locator('[data-slot="chart-tooltip-value"]')).toHaveText(
    "30",
  )
  await page.keyboard.press("Escape")
  await expect(tooltip).toBeHidden()
  await example
    .getByRole("button", { name: "Update deferred data", exact: true })
    .click()
  await expect(tooltip).toBeHidden()
})

test("Escape leaves unrelated chart focus and selection controls intact", async ({
  page,
}) => {
  await openPreview(page, "chart")

  const first = page.getByRole("region", {
    name: "First initial focus",
    exact: true,
  })

  const second = page.getByRole("region", {
    name: "Second initial focus",
    exact: true,
  })

  await first
    .getByRole("button", { name: "Show first chart", exact: true })
    .click()
  await second
    .getByRole("button", { name: "Show second chart", exact: true })
    .click()

  const firstTooltip = page
    .getByRole("status")
    .filter({ hasText: "First series" })

  const secondTooltip = page
    .getByRole("status")
    .filter({ hasText: "Second series" })

  await expect(firstTooltip).toBeVisible()
  await expect(secondTooltip).toBeVisible()
  await page
    .getByRole("combobox", { name: "Lifecycle selection", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(firstTooltip).toBeVisible()
  await expect(secondTooltip).toBeVisible()
  await first
    .getByRole("img", { name: "First initial focus chart", exact: true })
    .focus()
  await page.keyboard.press("Escape")
  await expect(firstTooltip).toBeHidden()
  await expect(secondTooltip).toBeVisible()
  await second
    .getByRole("img", { name: "Second initial focus chart", exact: true })
    .focus()
  await page.keyboard.press("Escape")
  await expect(secondTooltip).toBeHidden()
})
