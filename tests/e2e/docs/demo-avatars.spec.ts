import { expect, test } from "@playwright/test"

import { openDocsPage } from "./helpers"

test("avatar preview loads its portrait", async ({ page }, testInfo) => {
  await openDocsPage(page, "/components/avatar")
  const image = page.getByRole("img", { name: "Casey Blake" })

  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute(
    "src",
    /^https:\/\/images\.unsplash\.com\//,
  )
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          element instanceof HTMLImageElement &&
          element.complete &&
          element.naturalWidth > 0,
      ),
    )
    .toBe(true)
  await testInfo.attach("avatar-preview", {
    body: await image.screenshot(),
    contentType: "image/png",
  })
})
