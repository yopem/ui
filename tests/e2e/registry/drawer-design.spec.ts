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
    const close = popup.getByRole("button", { name: "Close", exact: true })
    const shellBox = await popup.boundingBox()
    const surfaceBox = await surface.boundingBox()
    const closeBox = await close.boundingBox()

    if (!shellBox || !surfaceBox || !closeBox)
      throw new Error(
        "The Drawer frame, surface, and close control must render",
      )

    expect(surfaceBox.x).toBeGreaterThan(shellBox.x)
    expect(surfaceBox.y).toBeGreaterThan(shellBox.y)
    expect(closeBox.x + closeBox.width / 2).toBeGreaterThan(
      shellBox.x + shellBox.width / 2,
    )
    expect(closeBox.y + closeBox.height / 2).toBeLessThan(surfaceBox.y)
    await testInfo.attach(`drawer-${theme}`, {
      body: await popup.screenshot(),
      contentType: "image/png",
    })
    await close.click()
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(popup).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await expect(popup).toBeVisible()

    const bar = popup.locator('[data-slot="drawer-bar"]')
    const barBox = await bar.boundingBox()
    const swipeBox = await popup.boundingBox()

    if (!barBox || !swipeBox)
      throw new Error("The Drawer swipe handle must render")

    const swipeX = barBox.x + barBox.width / 2
    const swipeY = barBox.y + barBox.height / 2

    await page.mouse.move(swipeX, swipeY)
    await page.mouse.down()
    await page.mouse.move(swipeX, swipeBox.y + swipeBox.height + 100, {
      steps: 12,
    })
    await page.mouse.up()
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}
