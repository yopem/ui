import { expect, test } from "@playwright/test"

for (const example of ["p-table-3", "p-table-6"]) {
  test(`${example} preserves project cell content`, async ({ page }) => {
    await page.goto(`/examples/${example}`)
    await expect(
      page.getByRole("cell", { name: "Website Redesign", exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole("cell", { name: "Mobile App", exact: true }),
    ).toBeVisible()
  })
}

for (const example of ["p-table-4", "p-table-8"]) {
  test(`${example} preserves flight cell content`, async ({ page }) => {
    await page.goto(`/examples/${example}`)
    const row = page.getByRole("row").filter({
      has: page.getByRole("cell", { name: "AA1234", exact: true }),
    })
    await expect(
      row.getByRole("cell", { name: "Los Angeles", exact: true }),
    ).toBeVisible()
    await expect(
      row.getByRole("cell", { name: "1", exact: true }),
    ).toBeVisible()
  })
}
