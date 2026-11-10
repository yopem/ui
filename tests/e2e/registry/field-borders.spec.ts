import { expect, test } from "@playwright/test"

test("field borders do not change their controls", async ({
  page,
}, testInfo) => {
  await page.goto("/components/field")

  const preview = page.locator('[aria-label$="live preview"]').first()
  const normal = preview.getByRole("textbox", { name: "Name", exact: true })
  const bordered = preview.getByRole("textbox", { name: "Display name" })
  const normalField = normal.locator('xpath=ancestor::*[@data-slot="field"]')

  const borderedField = bordered.locator(
    'xpath=ancestor::*[@data-slot="field"]',
  )

  await expect(normalField).toHaveCSS("border-top-width", "0px")
  await expect(borderedField).toHaveCSS("border-top-width", "1px")
  await expect(normal.locator("..")).toHaveCSS("border-top-width", "1px")
  await expect(bordered.locator("..")).toHaveCSS("border-top-width", "1px")
  await expect(normalField).not.toHaveAttribute("bordered")
  await expect(borderedField).not.toHaveAttribute("bordered")
  await preview.getByText("Display name", { exact: true }).click()
  await expect(bordered).toBeFocused()
  await testInfo.attach("field-borders", {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  })
})

test("fieldset borders preserve legend and disabled behavior", async ({
  page,
}, testInfo) => {
  await page.goto("/components/fieldset")

  const preview = page.locator('[aria-label$="live preview"]').first()
  const normal = preview.getByRole("group", { name: "Station membership" })
  const bordered = preview.getByRole("group", { name: "Archived membership" })
  const normalInput = normal.getByRole("textbox", { name: "Group" })

  const disabledInput = bordered.getByRole("textbox", {
    name: "Archived group",
  })

  await expect(normal).toHaveCSS("border-top-width", "0px")
  await expect(bordered).toHaveCSS("border-top-width", "1px")
  await expect(normalInput.locator("..")).toHaveCSS("border-top-width", "1px")
  await expect(disabledInput.locator("..")).toHaveCSS("border-top-width", "1px")
  await expect(normal).not.toHaveAttribute("bordered")
  await expect(bordered).not.toHaveAttribute("bordered")
  await expect(bordered.locator("legend")).toHaveText("Archived membership")
  await expect(disabledInput).toBeDisabled()
  await preview.getByText("Group", { exact: true }).click()
  await expect(normalInput).toBeFocused()
  await testInfo.attach("fieldset-borders", {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  })
})
