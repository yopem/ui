import { expect, test } from "@playwright/test"

test("table preview preserves project cell content", async ({ page }) => {
  await page.goto("/components/table")
  const preview = page.locator('[aria-label$="live preview"]')
  await expect(
    preview.getByRole("cell", { name: "Website Redesign", exact: true }),
  ).toBeVisible()
  await expect(
    preview.getByRole("cell", { name: "Mobile App", exact: true }),
  ).toBeVisible()
})
