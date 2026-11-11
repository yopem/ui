import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("toast closes with an accessible icon button", async ({
  page,
}, testInfo) => {
  await openPreview(page, "toast")
  await page.getByRole("button", { name: "Default Toast", exact: true }).click()
  const toast = page.locator('[data-slot="toast-root"]').first()
  await toast.hover()

  const close = toast.getByRole("button", {
    name: "Dismiss notification",
    exact: true,
  })

  await expect(close).toBeVisible()
  await expect(close).toHaveText("")
  await testInfo.attach("toast-close-icon", {
    body: await toast.screenshot(),
    contentType: "image/png",
  })
  await close.click()
  await expect(toast).toBeHidden()
})
