import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`form input uses the control surface in ${theme} theme`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "form")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

    const control = page
      .locator('[aria-label$="live preview"] [data-slot="input-control"]')
      .first()

    await expect(control).toBeVisible()

    const colors = await control.evaluate((element) => {
      const probe = document.createElement("div")
      probe.style.backgroundColor = "var(--control-background)"
      document.documentElement.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()

      return { actual: getComputedStyle(element).backgroundColor, expected }
    })

    expect(colors.expected).not.toBe("rgba(0, 0, 0, 0)")
    expect(colors.actual).toBe(colors.expected)
    await testInfo.attach(`form-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })

  test(`textarea uses the control surface in ${theme} theme`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "textarea")

    const control = page
      .locator('[aria-label$="live preview"] [data-slot="textarea-control"]')
      .first()

    await expect(control).toBeVisible()

    const colors = await control.evaluate((element) => {
      const probe = document.createElement("div")
      probe.style.backgroundColor = "var(--control-background)"
      document.documentElement.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()

      return { expected, actual: getComputedStyle(element).backgroundColor }
    })

    expect(colors.actual).toBe(colors.expected)
    await expect(control.locator("textarea")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    )
    await testInfo.attach(`textarea-${theme}`, {
      body: await control.screenshot(),
      contentType: "image/png",
    })
  })

  for (const component of ["dialog", "sheet"] as const) {
    test(`${component} footer matches its popup in ${theme} theme`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await openPreview(page, component)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      await page
        .getByRole("button", {
          name: component === "dialog" ? "Open Dialog" : "Open Sheet",
        })
        .click()
      const popup = page.locator(`[data-slot="${component}-popup"]`)
      const footer = popup.locator(`[data-slot="${component}-footer"]`)
      await expect(popup).toBeVisible()
      await expect(footer).toBeVisible()

      const surface = popup.locator(`[data-slot="${component}-surface"]`)

      const popupColor = await surface.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )

      const surfaceColor = await popup.evaluate(() => {
        const probe = document.createElement("div")
        probe.style.backgroundColor = "var(--card)"
        document.documentElement.append(probe)
        const color = getComputedStyle(probe).backgroundColor
        probe.remove()

        return color
      })

      expect(popupColor).toBe(surfaceColor)

      const footerColor = await footer.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )

      expect(["rgba(0, 0, 0, 0)", popupColor]).toContain(footerColor)
      await expect(footer).toHaveCSS("border-top-width", "0px")
      await testInfo.attach(`${component}-${theme}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      })
    })
  }
}
