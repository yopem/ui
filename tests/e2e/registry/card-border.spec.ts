import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("cards support bordered and borderless surfaces", async ({
  page,
}, testInfo) => {
  await openPreview(page, "card")
  const preview = page.locator('[aria-label$="live preview"]')
  const card = preview.locator('[data-slot="card"]').first()
  const borderless = preview.getByLabel("Borderless card")

  await expect(card).toBeVisible()
  await expect(card).toHaveCSS("border-top-style", "solid")
  await expect(card).toHaveCSS("border-top-width", "1px")
  await expect(borderless).toBeVisible()
  await expect(borderless).toHaveCSS("border-top-width", "0px")
  await expect(borderless).not.toHaveAttribute("bordered")
  expect(
    await borderless.evaluate((element) => {
      const before = getComputedStyle(element, "::before")

      return before.content === "none" || before.boxShadow === "none"
    }),
  ).toBe(true)

  await borderless.evaluate((element) => {
    const frame = document.createElement("div")
    frame.dataset.slot = "card-frame"
    element.before(frame)
    frame.append(element)
  })
  expect(
    await borderless.evaluate((element) => {
      const cardBounds = element.getBoundingClientRect()
      const frameBounds = element.parentElement?.getBoundingClientRect()

      return (
        frameBounds !== undefined &&
        cardBounds.left >= frameBounds.left &&
        cardBounds.right <= frameBounds.right
      )
    }),
  ).toBe(true)
  await testInfo.attach("card-border-preview", {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  })
})
