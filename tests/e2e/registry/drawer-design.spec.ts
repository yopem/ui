import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`drawer uses one sidebar surface in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "drawer")
    const trigger = page.getByRole("button", { name: "Open drawer" })
    await trigger.click()
    const popup = page.getByRole("dialog", { name: "Station updates" })
    const surface = popup.locator('[data-slot="drawer-surface"]')
    const footer = surface.locator('[data-slot="drawer-footer"]')
    await expect(
      surface.getByRole("heading", { name: "Station updates" }),
    ).toBeVisible()
    await expect(popup).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(255, 255, 255)" : "rgb(9, 9, 9)",
    )
    await expect(surface).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(255, 255, 255)" : "rgb(9, 9, 9)",
    )
    await expect(surface).toHaveCSS("border-radius", "8px")
    await expect(footer).toHaveCount(0)
    await expect(
      popup.getByRole("button", { name: "Close", exact: true }),
    ).toHaveCount(1)
    const shellBox = await popup.boundingBox()
    const surfaceBox = await surface.boundingBox()
    expect(shellBox).not.toBeNull()
    expect(surfaceBox).not.toBeNull()
    expect(surfaceBox!.x).toBeGreaterThan(shellBox!.x)
    expect(surfaceBox!.y).toBeGreaterThan(shellBox!.y)
    await testInfo.attach(`drawer-${theme}`, {
      body: await popup.screenshot(),
      contentType: "image/png",
    })
    await popup
      .getByRole("button", { name: "Close", exact: true })
      .last()
      .click()
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(popup).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}
