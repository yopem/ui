import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("input border options preserve input behavior", async ({
  page,
}, testInfo) => {
  await openPreview(page, "input")

  const preview = page.locator('[aria-label$="live preview"]').first()

  const normal = preview.getByRole("textbox", {
    name: "Enter text",
    exact: true,
  })

  const input = preview.getByRole("textbox", {
    name: "Borderless input",
    exact: true,
  })

  const control = input.locator("..")

  const disabled = preview.getByRole("textbox", {
    name: "Disabled borderless input",
    exact: true,
  })

  const restored = preview.getByRole("textbox", {
    name: "Restored input border",
    exact: true,
  })

  await expect(normal.locator("..")).toHaveCSS("border-top-width", "1px")
  await expect(control).toHaveCSS("border-top-width", "0px")
  await expect(input).not.toHaveAttribute("bordered")
  await expect(control).not.toHaveAttribute("bordered")
  await expect(input).toHaveAttribute("aria-invalid", "true")

  const unfocusedShadow = await control.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  )

  await normal.focus()
  await page.keyboard.press("Tab")
  await expect(input).toBeFocused()
  await expect(control).not.toHaveCSS("box-shadow", "none")
  await expect(control).not.toHaveCSS("box-shadow", unfocusedShadow)
  await input.fill("Field notes")
  await expect(input).toHaveValue("Field notes")
  await expect(disabled).toBeDisabled()
  await page.keyboard.press("Tab")
  await expect(restored).toBeFocused()
  await page.keyboard.type("Skipped disabled input")
  await expect(disabled).toHaveValue("")
  await expect(restored.locator("..")).toHaveCSS("border-top-width", "1px")
  await testInfo.attach("borderless-input", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})

test("input group owns its border and keeps keyboard focus", async ({
  page,
}, testInfo) => {
  await openPreview(page, "input-group")

  const defaultGroup = page
    .locator('[aria-label$="live preview"] [data-slot="input-group"]')
    .first()

  await expect(defaultGroup).toHaveCSS("border-top-width", "1px")

  await openPreview(page, "input")

  const preview = page.locator('[aria-label$="live preview"]').first()

  const input = preview.getByRole("textbox", {
    name: "Borderless group input",
    exact: true,
  })

  const group = input.locator('xpath=ancestor::*[@data-slot="input-group"]')
  await expect(group).toHaveCSS("border-top-width", "0px")
  await expect(group).not.toHaveAttribute("bordered")
  await expect(input).not.toHaveAttribute("bordered")

  const unfocusedShadow = await group.evaluate(
    (element) => getComputedStyle(element).boxShadow,
  )

  await preview
    .getByRole("textbox", { name: "Restored input border", exact: true })
    .focus()
  await page.keyboard.press("Tab")
  await expect(input).toBeFocused()
  await expect(group).not.toHaveCSS("box-shadow", "none")
  await expect(group).not.toHaveCSS("box-shadow", unfocusedShadow)
  await input.fill("Search notes")
  await expect(input).toHaveValue("Search notes")
  await testInfo.attach("borderless-input-group", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})
