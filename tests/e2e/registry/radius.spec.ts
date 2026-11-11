import { expect, test } from "@playwright/test"

for (const [component, slot] of [
  ["button", "button"],
  ["input", "input-control"],
  ["card", "card"],
  ["tabs", "tabs-list"],
] as const) {
  test(`${component} follows the main radius token`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/components/${component}`, {
      waitUntil: "domcontentloaded",
    })

    const surface = page
      .locator(`[aria-label$="live preview"] [data-slot="${slot}"]`)
      .first()

    await expect(surface).toBeVisible()
    await expect(surface).toHaveCSS("border-top-left-radius", "12px")
    await page.evaluate(() =>
      document.documentElement.style.setProperty("--radius", "20px"),
    )
    await expect(surface).toHaveCSS("border-top-left-radius", "20px")
    await testInfo.attach(`${component}-main-radius`, {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    })
  })
}

test("radio indicators stay circular", async ({ page }) => {
  await page.goto("/components/radio-group", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  await expect(page.getByRole("radio").first()).toHaveCSS(
    "border-top-left-radius",
    "9999px",
  )
})
