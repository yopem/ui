import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("table row borders are opt-in", async ({ page }, testInfo) => {
  await openPreview(page, "table")
  const table = page.getByRole("table").first()
  const row = table.locator("tbody tr").first()
  const toggle = page.getByRole("button", { name: "Row borders", exact: true })

  await expect(row).toHaveCSS("border-bottom-width", "0px")
  await expect(toggle).toHaveAttribute("aria-pressed", "false")
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-pressed", "true")
  await expect(row).toHaveCSS("border-bottom-width", "1px")
  await expect(table).not.toHaveAttribute("rowBorders")
  await testInfo.attach("table-row-borders", {
    body: await table.screenshot(),
    contentType: "image/png",
  })
  await toggle.click()
  await expect(row).toHaveCSS("border-bottom-width", "0px")
})
