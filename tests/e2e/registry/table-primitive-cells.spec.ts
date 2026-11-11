import { expect, test } from "@playwright/test"

test("table preview preserves reservation cell content", async ({ page }) => {
  await page.goto("/components/table", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const preview = page.locator('[aria-label$="live preview"]')
  await expect(
    preview.getByRole("cell", { name: "Dawn bird count", exact: true }),
  ).toBeVisible()
  await expect(
    preview.getByRole("cell", { name: "River sound survey", exact: true }),
  ).toBeVisible()
})
