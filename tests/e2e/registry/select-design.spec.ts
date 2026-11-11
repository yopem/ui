import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("select supports pointer and keyboard selection", async ({ page }) => {
  await openPreview(page, "select")
  const trigger = page.getByRole("combobox", { name: "Select equipment" })
  await trigger.click()
  await page.getByRole("option", { name: "Trail mapping" }).click()
  await expect(trigger).toContainText("Trail mapping")
  await expect(trigger).toBeFocused()

  await trigger.focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("listbox")).not.toBeVisible()
  await expect(trigger).toBeFocused()

  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("Enter")
  await expect(trigger).toContainText("Audio recording")
  await expect(trigger).toBeFocused()
})

for (const theme of ["light", "dark"] as const) {
  test(`select surfaces and option states in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "select")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
    const trigger = page.getByRole("combobox", { name: "Select equipment" })
    await expect(trigger).toHaveCSS("border-radius", "12px")
    await expect(trigger).toHaveCSS("height", "40px")
    await trigger.click()
    const selected = page.getByRole("option", { name: "Birdwatching" })
    const other = page.getByRole("option", { name: "Audio recording" })
    await expect(selected).toHaveAttribute("aria-selected", "true")

    const neutral = await other.evaluate((element) => {
      const probe = document.createElement("span")
      probe.style.backgroundColor = "var(--accent)"
      element.append(probe)
      const color = getComputedStyle(probe).backgroundColor
      probe.remove()

      return color
    })

    expect(neutral).not.toBe("rgba(0, 0, 0, 0)")
    await other.hover()
    await expect(other).toHaveCSS("background-color", neutral)
    await expect(selected).toHaveCSS("background-color", "rgb(37, 99, 235)")
    await expect(selected).toHaveCSS("color", "rgb(255, 255, 255)")
    await selected.hover()
    await expect(selected).toHaveCSS("background-color", "rgb(37, 99, 235)")
    await testInfo.attach(`select-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}
