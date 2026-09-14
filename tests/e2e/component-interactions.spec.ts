import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
})

test("dialog opens from keyboard, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.goto("/render/light/p-dialog-1")
  const trigger = page.getByRole("button", { name: "Open Dialog" })

  await trigger.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Edit profile" })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole("button", { name: "Close" })).toHaveCSS(
    "position",
    "absolute",
  )
  await expect(dialog.locator(":focus")).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test("tabs support arrow-key navigation", async ({ page }) => {
  await page.goto("/render/light/p-tabs-1")
  const firstTab = page.getByRole("tab", { name: "Tab 1" })
  const secondTab = page.getByRole("tab", { name: "Tab 2" })

  await firstTab.focus()
  await page.keyboard.press("ArrowRight")
  await expect(secondTab).toBeFocused()

  await page.keyboard.press("Enter")
  await expect(secondTab).toHaveAttribute("aria-selected", "true")
  await expect(page.getByText("Tab 2 content")).toBeVisible()
})

test("checkbox toggles with Space", async ({ page }) => {
  await page.goto("/render/light/p-checkbox-1")
  const checkbox = page.getByRole("checkbox", {
    name: "Accept terms and conditions",
  })

  await checkbox.focus()
  await page.keyboard.press("Space")
  await expect(checkbox).toBeChecked()

  await page.keyboard.press("Space")
  await expect(checkbox).not.toBeChecked()
})
