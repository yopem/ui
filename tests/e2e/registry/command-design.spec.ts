import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`command palette surface and search in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "command")
    const trigger = page.getByRole("button", { name: /Open Command Palette/ })
    await expect(trigger).toBeEnabled()
    await trigger.focus()
    await page.keyboard.press("Enter")

    const popup = page.getByRole("dialog", { name: "Command palette" })
    await expect(popup).toHaveAttribute("data-slot", "command-dialog-popup")
    const surface = popup.locator('[data-slot="dialog-surface"]')
    const panel = surface.locator('[data-slot="command-panel"]')
    await expect(
      popup.getByText("Command palette", { exact: true }),
    ).toBeVisible()
    const input = page.getByPlaceholder("Search station tools...")
    const control = popup.locator('[data-slot="input-control"]')
    await expect(input).toBeFocused()

    const colors = await popup.evaluate((element) => {
      const probe = document.createElement("span")
      element.append(probe)
      probe.style.backgroundColor = "var(--overlay-shell)"
      const shell = getComputedStyle(probe).backgroundColor
      probe.style.backgroundColor = "var(--card)"
      const card = getComputedStyle(probe).backgroundColor
      probe.style.backgroundColor = "var(--accent)"
      const accent = getComputedStyle(probe).backgroundColor
      probe.remove()

      return { shell, card, accent }
    })

    await expect(popup).toHaveCSS("background-color", colors.shell)
    await expect(surface).toHaveCSS("background-color", colors.card)
    await expect(surface).toHaveCSS("border-radius", "8px")
    const shellBox = await popup.boundingBox()
    const surfaceBox = await surface.boundingBox()
    expect(shellBox).not.toBeNull()
    expect(surfaceBox).not.toBeNull()
    expect(surfaceBox!.x).toBeGreaterThan(shellBox!.x)
    expect(surfaceBox!.y).toBeGreaterThan(shellBox!.y)
    await expect(panel).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
    await expect(panel).toHaveCSS("border-top-width", "0px")
    await expect(panel).toHaveCSS("box-shadow", "none")
    await expect(control).toHaveCSS("border-top-width", "0px")
    await expect(control).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
    await expect(control).toHaveCSS("box-shadow", "none")
    await expect(
      popup.locator('[data-slot="command-input-wrapper"]'),
    ).not.toHaveCSS("box-shadow", "none")

    const separation = await input.evaluate((element) => {
      const icon = element
        .closest('[data-slot="autocomplete-input-group"]')
        ?.querySelector('[data-slot="autocomplete-start-addon"] svg')

      if (!icon) throw new Error("Command search icon is missing")

      const bounds = element.getBoundingClientRect()

      const textStart =
        bounds.left + Number.parseFloat(getComputedStyle(element).paddingLeft)

      return textStart - icon.getBoundingClientRect().right
    })

    expect(separation).toBeGreaterThanOrEqual(8)

    const option = page.getByRole("option", { name: /Field notebook/ })
    await option.hover()
    await expect(option).toHaveCSS("background-color", colors.accent)
    await testInfo.attach(`command-${theme}`, {
      body: await popup.screenshot(),
      contentType: "image/png",
    })

    await input.fill("no matching station 7462")
    await expect(popup.locator('[data-slot="command-empty"]')).toBeVisible()
    await input.fill("Field notebook")
    await expect(option).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
  })
}

test("homepage and docs use the same Command example", async ({
  page,
}, testInfo) => {
  let options: string[] | undefined

  for (const path of ["/components/command", "/"]) {
    await page.goto(path)
    await expect(
      page.getByRole("button", { name: "Search documentation", exact: true }),
    ).toBeEnabled()

    if (path === "/") {
      await page
        .getByRole("region", { name: "Command", exact: true })
        .scrollIntoViewIfNeeded()
    }

    const trigger = page.getByRole("button", { name: /Open Command Palette/ })

    await trigger.click()
    const popup = page.getByRole("dialog", { name: "Command palette" })
    const input = popup.getByPlaceholder("Search station tools...")

    await expect(input).toBeFocused()
    await expect(
      popup.getByRole("option", { name: /Loan register/ }),
    ).toBeVisible()
    const names = await popup.getByRole("option").allTextContents()

    if (options) expect(names).toEqual(options)
    else options = names

    await testInfo.attach(path === "/" ? "homepage-command" : "docs-command", {
      body: await popup.screenshot(),
      contentType: "image/png",
    })
    await input.fill("Route library")
    await expect(
      popup.getByRole("option", { name: /Route library/ }),
    ).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
  }
})
