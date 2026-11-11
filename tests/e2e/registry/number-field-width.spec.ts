import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("number field supports compact and full-width controls", async ({
  page,
}, testInfo) => {
  await openPreview(page, "number-field")
  const preview = page.locator('[aria-label$="live preview"]').first()

  const compact = preview.getByRole("spinbutton", {
    name: "Quantity",
    exact: true,
  })

  const wide = preview.getByRole("spinbutton", { name: "Full-width quantity" })

  const compactRoot = compact.locator(
    'xpath=ancestor::*[@data-slot="number-field"]',
  )

  const wideRoot = wide.locator('xpath=ancestor::*[@data-slot="number-field"]')

  const parentWidth = await wideRoot
    .locator("..")
    .evaluate((element) => element.getBoundingClientRect().width)

  expect((await compactRoot.boundingBox())?.width).toBeLessThan(parentWidth)
  expect(
    Math.abs((await wideRoot.boundingBox())!.width - parentWidth),
  ).toBeLessThan(2)
  await expect(wideRoot).not.toHaveAttribute("fullWidth")
  await expect(compactRoot).not.toHaveAttribute("fullWidth")
  await compactRoot.locator('[data-slot="number-field-increment"]').click()
  await expect(compact).toHaveValue("1")
  await compactRoot.locator('[data-slot="number-field-decrement"]').click()
  await expect(compact).toHaveValue("0")
  await compact.fill("4")
  await compact.press("ArrowUp")
  await expect(compact).toHaveValue("5")
  await expect(
    wideRoot.locator('[data-slot="number-field-decrement"]'),
  ).toBeDisabled()
  await wide.fill("2")
  await wide.press("Tab")
  await expect(
    wideRoot.locator('[data-slot="number-field-increment"]'),
  ).toBeDisabled()
  await testInfo.attach("number-field-widths", {
    body: await preview.screenshot(),
    contentType: "image/png",
  })
})
