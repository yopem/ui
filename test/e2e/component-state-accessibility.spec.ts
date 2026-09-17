import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const cases = [
  ["alert-dialog", "p-alert-dialog-1", "Are you absolutely sure?"],
  ["dialog", "p-dialog-1", "Edit profile"],
  ["drawer", "p-drawer-1", "Notifications"],
  ["menu", "p-menu-1", "Open in new tab"],
  ["popover", "p-popover-1", "Send us feedback"],
  ["preview-card", "p-preview-card-1", "A collection of copy-and-paste"],
  ["select", "p-select-1", "Astro"],
  ["sheet", "p-sheet-1", "Edit profile"],
  ["tooltip", "p-tooltip-1", "Helpful hint"],
] as const

for (const [component, example, visibleText] of cases) {
  test(`${component} open state has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(`/examples/${example}?theme=light`)

    if (component === "alert-dialog")
      await page.getByRole("button", { name: "Delete Account" }).click()
    else if (component === "dialog")
      await page.getByRole("button", { name: "Open Dialog" }).click()
    else if (component === "drawer")
      await page.getByRole("button", { name: "Open drawer" }).click()
    else if (component === "menu")
      await page.getByRole("button", { name: "Open menu" }).click()
    else if (component === "popover")
      await page.getByRole("button", { name: "Open Popover" }).click()
    else if (component === "preview-card")
      await page.getByRole("button", { name: "coss.com/ui" }).focus()
    else if (component === "select")
      await page.getByRole("combobox", { name: "Select framework" }).click()
    else if (component === "sheet")
      await page.getByRole("button", { name: "Open Sheet" }).click()
    else await page.getByRole("button", { name: "Hover me" }).hover()

    await expect(
      page.getByText(visibleText, { exact: false }).last(),
    ).toBeVisible()
    const result = await new AxeBuilder({ page }).analyze()
    expect(
      result.violations.map(({ help, id, nodes }) => ({
        help,
        id,
        targets: nodes.flatMap((node) => node.target),
      })),
    ).toEqual([])
  })
}

test("context menu keyboard alternative opens an accessible menu", async ({
  page,
}) => {
  await page.goto("/examples/p-context-menu-1?theme=light")
  const trigger = page.getByText("Right click here", { exact: true })
  await trigger.focus()
  await page.keyboard.press("Shift+F10")
  await expect(page.getByRole("menuitem", { name: "Back" })).toBeVisible()
  const result = await new AxeBuilder({ page }).analyze()
  expect(result.violations).toEqual([])
})
