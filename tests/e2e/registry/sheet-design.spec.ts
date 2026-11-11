import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`sheet frame and footer use surface colors in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "sheet")
    await page.getByRole("button", { name: "Open Sheet" }).click()

    const popup = page.getByRole("dialog", { name: "Edit field visit" })
    const surface = popup.locator('[data-slot="sheet-surface"]')
    const footer = surface.locator('[data-slot="sheet-footer"]')
    await expect(popup.getByText("Field visit", { exact: true })).toBeVisible()
    await expect(
      surface.getByRole("heading", { name: "Edit field visit" }),
    ).toBeVisible()
    await expect(popup).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(243, 244, 246)" : "rgb(9, 9, 9)",
    )
    await expect(surface).toHaveCSS(
      "background-color",
      theme === "light" ? "rgb(255, 255, 255)" : "rgb(17, 17, 17)",
    )
    await expect(surface).toHaveCSS("border-radius", "8px")
    await expect(footer).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
    await expect(footer).toHaveCSS("border-top-width", "0px")
    const box = await popup.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x + box!.width).toBeCloseTo(1024, 0)
    await testInfo.attach(`sheet-${theme}`, {
      body: await popup.screenshot(),
      contentType: "image/png",
    })
  })
}

test("sheet focuses the input and restores focus after close and Escape", async ({
  page,
}) => {
  await openPreview(page, "sheet")
  const trigger = page.getByRole("button", { name: "Open Sheet" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const popup = page.getByRole("dialog", { name: "Edit field visit" })
  await expect(popup.getByRole("textbox", { name: "Name" })).toBeFocused()
  await expect(popup.getByRole("textbox", { name: "Location" })).toHaveValue(
    "East reed bed",
  )
  await popup.getByRole("button", { name: "Close" }).click()
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("sheet remains usable in a short mobile viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 240 })
  await openPreview(page, "sheet")
  await page.getByRole("button", { name: "Open Sheet" }).click()
  const popup = page.getByRole("dialog", { name: "Edit field visit" })
  const save = popup.getByRole("button", { name: "Save" })
  await save.focus()
  await expect(save).toBeInViewport()
  const name = popup.getByRole("textbox", { name: "Name" })
  await name.focus()
  await expect(name).toBeInViewport()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375)
  await testInfo.attach("sheet-mobile", {
    body: await popup.screenshot(),
    contentType: "image/png",
  })
})
