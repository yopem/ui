import { expect, test } from "@playwright/test"

test("default surfaces use md while radio indicators stay circular", async ({
  page,
}) => {
  await page.goto("/components/card", { waitUntil: "domcontentloaded" })
  await expect(page.locator('[data-slot="card"]').first()).toHaveCSS(
    "border-top-left-radius",
    "12px",
  )
  await page.goto("/components/radio-group", { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("radio").first()).toHaveCSS(
    "border-top-left-radius",
    "9999px",
  )
})
