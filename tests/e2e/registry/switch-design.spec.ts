import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await openPreview(page, "switch")
  await expect(
    page.getByRole("switch", { name: "Trail condition alerts" }),
  ).toBeVisible()
})

test("switch responds to pointer and keyboard with a blue checked track", async ({
  page,
}, testInfo) => {
  const control = page.getByRole("switch", { name: "Trail condition alerts" })
  const thumb = control.locator('[data-slot="switch-thumb"]')
  const track = await control.boundingBox()
  const off = await thumb.boundingBox()

  if (!track || !off) throw new Error("Switch must have visible bounds")
  expect(track.width).toBe(37)
  expect(track.height).toBe(18)
  expect(off.width).toBe(8)
  expect(off.height).toBe(8)
  await control.click()
  await expect(control).toBeChecked()
  await expect
    .poll(async () => (await thumb.boundingBox())?.x ?? 0)
    .toBeGreaterThan(off.x)

  const blue = await control.evaluate((element) => {
    const color = getComputedStyle(element).backgroundColor
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) return false
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data

    return blue > green && green > red
  })

  expect(blue).toBe(true)
  await testInfo.attach("switch-checked", {
    body: await control.screenshot(),
    contentType: "image/png",
  })
  await control.focus()
  await page.keyboard.press("Space")
  await expect(control).not.toBeChecked()
})

test("disabled switch does not activate", async ({ page }) => {
  const control = page.getByRole("switch", { name: "Disabled alerts" })
  await expect(control).toBeDisabled()
  const bounds = await control.boundingBox()

  if (!bounds) throw new Error("Disabled switch must have visible bounds")
  await page.mouse.click(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  )
  await expect(control).not.toBeChecked()
  await control.focus()
  await page.keyboard.press("Space")
  await expect(control).not.toBeChecked()
})

test("thumb moves toward the left in RTL", async ({ page }) => {
  await page
    .locator("html")
    .evaluate((element) => element.setAttribute("dir", "rtl"))
  const control = page.getByRole("switch", { name: "Trail condition alerts" })
  const thumb = control.locator('[data-slot="switch-thumb"]')
  const off = await thumb.boundingBox()

  if (!off) throw new Error("Switch thumb must have visible bounds")
  await control.click()
  await expect(control).toBeChecked()
  await expect
    .poll(async () => (await thumb.boundingBox())?.x ?? Infinity)
    .toBeLessThan(off.x)
})

test("thumb follows explicit LTR direction with Arabic language", async ({
  page,
}) => {
  await page.locator("html").evaluate((element) => {
    element.setAttribute("lang", "ar")
    element.setAttribute("dir", "ltr")
  })

  const control = page.getByRole("switch", { name: "Trail condition alerts" })
  const thumb = control.locator('[data-slot="switch-thumb"]')
  const off = await thumb.boundingBox()

  if (!off) throw new Error("Switch thumb must have visible bounds")
  await control.click()
  await expect(control).toBeChecked()
  await expect
    .poll(async () => (await thumb.boundingBox())?.x ?? 0)
    .toBeGreaterThan(off.x)
})

test("coarse pointer can activate outside the visual track", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Requires a touch-enabled coarse pointer")
  const control = page.getByRole("switch", { name: "Trail condition alerts" })
  const bounds = await control.boundingBox()

  if (!bounds) throw new Error("Switch must have visible bounds")
  expect(bounds.width).toBe(37)
  expect(bounds.height).toBe(18)
  await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y - 8)
  await expect(control).toBeChecked()
})
