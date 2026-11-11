import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`combobox options use neutral hover in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "combobox")
    await page
      .getByRole("button", { name: "Toggle suggestions", exact: true })
      .click()

    const option = page.getByRole("option", {
      name: "Audio recorder",
      exact: true,
    })

    await option.hover()

    const colors = await option.evaluate((element) => {
      const probe = document.createElement("span")
      probe.style.backgroundColor = "var(--accent)"
      element.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()

      return { expected, actual: getComputedStyle(element).backgroundColor }
    })

    expect(colors.actual).toBe(colors.expected)
    await expect(option).toHaveCSS("border-radius", "8px")
    await testInfo.attach(`combobox-hover-${theme}`, {
      body: await page.getByRole("listbox").screenshot(),
      contentType: "image/png",
    })
    await option.click()
    const input = page.getByRole("combobox", { name: "Select equipment" })

    await expect(input).toHaveValue("Audio recorder")
    await page
      .getByRole("button", { name: "Toggle suggestions", exact: true })
      .click()
    await expect(option).toHaveAttribute("data-selected", "")
    await option.hover()

    const selected = await option.evaluate((element) => {
      const probe = document.createElement("span")
      element.append(probe)
      probe.style.backgroundColor = "var(--accent-solid)"
      const background = getComputedStyle(probe).backgroundColor
      probe.style.color = "var(--accent-solid-foreground)"
      const foreground = getComputedStyle(probe).color
      probe.remove()

      return { background, foreground }
    })

    await expect(option).toHaveCSS("background-color", selected.background)
    await expect(option).toHaveCSS("color", selected.foreground)
    await testInfo.attach(`combobox-selected-${theme}`, {
      body: await page.getByRole("listbox").screenshot(),
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(page.getByRole("listbox")).toBeHidden()
    await expect(input).toBeFocused()
  })
}
