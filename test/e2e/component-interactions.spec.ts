import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
})

test("dialog opens from keyboard, closes with Escape, and restores focus", async ({
  page,
}) => {
  await page.goto("/examples/p-dialog-1?theme=light")
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
  await page.goto("/examples/p-tabs-1?theme=light")
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
  await page.goto("/examples/p-checkbox-1?theme=light")
  const checkbox = page.getByRole("checkbox", {
    name: "Accept terms and conditions",
  })

  await checkbox.focus()
  await page.keyboard.press("Space")
  await expect(checkbox).toBeChecked()

  await page.keyboard.press("Space")
  await expect(checkbox).not.toBeChecked()
})

test("detached handles stay scoped to each example", async ({ page }) => {
  const warnings: string[] = []
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text())
  })

  await page.goto("/components/tooltip")
  await expect(page.getByRole("button", { name: "Toggle bold" })).toHaveCount(3)

  expect(warnings).not.toContainEqual(
    expect.stringContaining(
      "A handle is attached to more than one mounted root",
    ),
  )
})

test("toast appears after trigger click", async ({ page }) => {
  await page.goto("/examples/p-toast-1?theme=light")
  await page.getByRole("button", { name: "Default Toast" }).click()

  await expect(page.getByText("Event has been created")).toBeVisible()
})

test("accordion and collapsible expose expanded state", async ({ page }) => {
  await page.goto("/examples/p-accordion-1?theme=light")
  const accordion = page.getByRole("button", { name: "What is Base UI?" })
  await accordion.focus()
  await page.keyboard.press("Enter")
  await expect(accordion).toHaveAttribute("aria-expanded", "true")
  await expect(
    page.getByText("Base UI is a library", { exact: false }),
  ).toBeVisible()

  await page.goto("/examples/p-collapsible-1?theme=light")
  const collapsible = page.getByRole("button", { name: "Show recovery keys" })
  await collapsible.focus()
  await page.keyboard.press("Space")
  await expect(collapsible).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText("4829-1735-6621")).toBeVisible()
})

test("switch, toggle, and radio group support keyboard state changes", async ({
  page,
}) => {
  await page.goto("/examples/p-switch-1?theme=light")
  const switchControl = page.getByRole("switch", { name: "Marketing emails" })
  await switchControl.focus()
  await page.keyboard.press("Space")
  await expect(switchControl).toBeChecked()

  await page.goto("/examples/p-toggle-1?theme=light")
  const toggle = page.getByRole("button", { name: "Toggle" })
  await toggle.focus()
  await page.keyboard.press("Space")
  await expect(toggle).toHaveAttribute("aria-pressed", "true")

  await page.goto("/examples/p-radio-group-1?theme=light")
  const next = page.getByRole("radio", { name: "Next.js" })
  const vite = page.getByRole("radio", { name: "Vite" })
  await next.focus()
  await page.keyboard.press("ArrowDown")
  await expect(vite).toBeChecked()
  await expect(vite).toBeFocused()
})

test("select supports keyboard selection and restores focus", async ({
  page,
}) => {
  await page.goto("/examples/p-select-1?theme=light")
  const trigger = page.getByRole("combobox", { name: "Select framework" })
  await trigger.focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(trigger).toContainText("Vite")
  await expect(trigger).toBeFocused()
})
