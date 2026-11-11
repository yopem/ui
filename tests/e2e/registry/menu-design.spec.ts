import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  for (const kind of ["menu", "context-menu"] as const) {
    test(`${kind} surface and interaction in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await openPreview(page, kind)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

      if (kind === "menu") {
        await page.getByRole("button", { name: "Open menu" }).click()
      } else {
        await page
          .getByText("Right-click a field note")
          .click({ button: "right" })
      }

      const popup = page.locator(`[data-slot="${kind}-popup"]`).first()
      await expect(popup).toBeVisible()

      const colors = await popup.evaluate((element) => {
        const probe = document.createElement("span")
        element.append(probe)

        function color(token: string) {
          probe.style.color = `var(${token})`

          return getComputedStyle(probe).color
        }

        const result = {
          popover: color("--popover"),
          accent: color("--accent"),
          selected: color("--accent-solid"),
          destructive: color("--destructive-foreground"),
        }

        probe.remove()

        return result
      })

      await expect(popup).toHaveCSS("background-color", colors.popover)
      await expect(popup).toHaveCSS("border-top-width", "0px")
      await expect(popup).toHaveCSS("border-radius", "12px")
      await expect(popup).not.toHaveCSS("box-shadow", "none")

      const item = popup.getByRole("menuitem", {
        name: kind === "menu" ? "Play" : "Open note",
      })

      await expect(item).toHaveCSS("font-size", "14px")

      const coarse = await page.evaluate(
        () => matchMedia("(pointer: coarse)").matches,
      )

      expect(
        await item.evaluate(
          (element) => element.getBoundingClientRect().height,
        ),
      ).toBeGreaterThanOrEqual(coarse ? 44 : 32)

      if (!coarse) {
        await item.hover()
        await expect(item).toHaveCSS("background-color", colors.accent)
        expect(colors.accent).not.toBe(colors.selected)
        await testInfo.attach(`${kind}-${theme}-hover`, {
          body: await page.screenshot(),
          contentType: "image/png",
        })

        if (kind === "menu") {
          const destructive = popup.getByRole("menuitem", { name: "Delete" })

          await destructive.hover()
          await expect(destructive).toHaveCSS("background-color", colors.accent)
          await expect(destructive).toHaveCSS("color", colors.destructive)
        }
      }

      const checkbox = popup.getByRole("menuitemcheckbox", {
        name: kind === "menu" ? "Shuffle" : "Pin note",
      })

      await checkbox.click()
      await expect(checkbox).toHaveAttribute("aria-checked", "true")
      await expect(checkbox.locator("svg")).toHaveCSS("color", colors.selected)

      const disabled = popup.getByRole("menuitemcheckbox", {
        name: kind === "menu" ? "Wind reduction" : "Archive note",
      })

      await expect(disabled).toHaveAttribute("aria-disabled", "true")
      await expect(disabled).toHaveAttribute("aria-checked", "false")

      if (!coarse) {
        const box = await disabled.boundingBox()

        expect(box).not.toBeNull()

        if (!box) throw new Error("Disabled item has no bounding box")

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await expect(disabled).not.toHaveAttribute("data-highlighted", "")
        await expect(disabled).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
        await expect(disabled).toHaveAttribute("aria-checked", "false")
      }

      const subTrigger = popup.getByRole("menuitem", {
        name: kind === "menu" ? "Add to collection" : "Move note",
      })

      const subPopup = page.locator(`[data-slot="${kind}-sub-content"]`)

      if (!coarse) {
        await subTrigger.hover()
        await expect(subPopup).toBeVisible()
        await expect(subTrigger).toHaveCSS("background-color", colors.accent)
        await page.keyboard.press("Escape")
        await expect(subPopup).not.toBeVisible()
      }

      await subTrigger.focus()
      await page.keyboard.press("ArrowRight")
      await expect(subPopup).toBeVisible()
      await expect(subTrigger).toHaveCSS("background-color", colors.accent)
      await expect(subPopup).toHaveCSS("background-color", colors.popover)
      await expect(subPopup).toHaveCSS("border-top-width", "0px")
      await testInfo.attach(`${kind}-${theme}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      })
      await page.keyboard.press("Escape")
      await expect(subPopup).not.toBeVisible()
      await expect(subTrigger).toBeFocused()
    })
  }
}
