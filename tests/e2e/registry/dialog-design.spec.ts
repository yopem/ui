import { expect, test } from "@playwright/test"

for (const theme of ["light", "dark"] as const) {
  for (const kind of ["dialog", "alert-dialog"] as const) {
    test(`${kind} has an inset surface in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await page.goto(`/components/${kind}`)

      const trigger = page
        .getByRole("button", {
          name: kind === "dialog" ? "Open Dialog" : "Delete field note",
        })
        .first()

      await trigger.click()
      const popup = page.locator(`[data-slot="${kind}-popup"]`)
      const surface = popup.locator(`[data-slot="${kind}-surface"]`)
      await expect(popup).toBeVisible()
      await expect(surface).toBeVisible()
      await expect(
        popup.getByText(kind === "dialog" ? "Reservation" : "Delete note", {
          exact: true,
        }),
      ).toBeVisible()
      await expect(surface.getByRole("heading")).toBeVisible()

      const colors = await popup.evaluate((element) => ({
        shell: getComputedStyle(element).backgroundColor,
        surface: getComputedStyle(
          element.querySelector('[data-slot$="-surface"]')!,
        ).backgroundColor,
      }))

      expect(colors.shell).not.toBe(colors.surface)
      await expect(popup).toHaveCSS("border-radius", "12px")
      await expect(surface).toHaveCSS("border-radius", "8px")
      await testInfo.attach(`${kind}-${theme}`, {
        body: await popup.screenshot(),
        contentType: "image/png",
      })
    })
  }
}

test("dialog keeps input focus, dismisses, and returns focus", async ({
  page,
}) => {
  await page.goto("/components/dialog")
  const trigger = page.getByRole("button", { name: "Open Dialog" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Edit reservation" })
  await expect(dialog.getByRole("textbox", { name: "Name" })).toBeFocused()
  await dialog.getByRole("button", { name: "Close" }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("alert close cancels without activating the destructive action", async ({
  page,
}) => {
  await page.goto("/components/alert-dialog")

  const trigger = page
    .getByRole("button", { name: "Delete field note" })
    .first()

  await trigger.click()

  const dialog = page.getByRole("alertdialog", {
    name: "Delete this field note?",
  })

  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused()
  await dialog
    .getByRole("button", { name: "Delete field note" })
    .evaluate((button) => {
      button.addEventListener("click", () =>
        document.documentElement.setAttribute("data-confirmed", "true"),
      )
    })
  await dialog.getByRole("button", { name: "Close" }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-confirmed",
    "true",
  )
})

test("dialog remains usable in a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 240 })
  await page.goto("/components/dialog")
  await page.getByRole("button", { name: "Open Dialog" }).click()
  const dialog = page.getByRole("dialog", { name: "Edit reservation" })
  const save = dialog.getByRole("button", { name: "Save" })
  await save.focus()
  await expect(save).toBeInViewport()
  await dialog.getByRole("textbox", { name: "Name" }).focus()
  await expect(dialog.getByRole("textbox", { name: "Name" })).toBeInViewport()
})
