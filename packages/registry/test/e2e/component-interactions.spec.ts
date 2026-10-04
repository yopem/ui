import type { Page } from "@playwright/test"

import { expect, test } from "@playwright/test"

async function openPreview(page: Page, slug: string) {
  await page.goto(`/components/${slug}`)
  await expect(
    page.getByRole("button", { name: /^Copy .* usage$/ }).first(),
  ).toBeEnabled()
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
})

test("dialog opens from keyboard, closes with Escape, and restores focus", async ({
  page,
}) => {
  await openPreview(page, "dialog")
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

test("command palette focuses input on open and restores trigger focus", async ({
  page,
}) => {
  await openPreview(page, "command")
  const trigger = page.getByRole("button", { name: /Open Command Palette/ })
  await expect(trigger).toBeEnabled()
  await expect(trigger).not.toBeFocused()
  await trigger.focus()
  await page.keyboard.press("Enter")
  const input = page.getByPlaceholder("Search for apps and commands...")
  await expect(input).toBeFocused()
  await input.fill("Figma")
  await page.getByRole("option", { name: /Figma/ }).click()
  await expect(input).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await expect(input).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(input).toBeHidden()
  await expect(trigger).toBeFocused()

  for (let cycle = 0; cycle < 3; cycle++) {
    await page.keyboard.press("Control+j")
    await expect(input).toBeFocused()
    await page.keyboard.press("Control+j")
    await expect(input).toBeHidden()
    await expect(trigger).toBeFocused()
  }
})

test("timed previews advance and restart after navigation", async ({
  page,
}) => {
  await openPreview(page, "progress")
  const progress = page.getByRole("progressbar", { name: "Upload progress" })
  await expect
    .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
    .toBeGreaterThan(20)

  await openPreview(page, "skeleton")
  await expect(page.locator('[data-slot="skeleton"]')).not.toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: "Sarah Johnson" }),
  ).toBeVisible({
    timeout: 6000,
  })
  await expect(
    page.getByRole("heading", { name: "Mark Bennett Andersson" }),
  ).toBeVisible({ timeout: 6000 })
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)

  await openPreview(page, "progress")
  await expect(progress).toHaveAttribute("aria-valuenow", "20")
  await expect
    .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
    .toBeGreaterThan(20)
})

test("tabs support arrow-key navigation", async ({ page }) => {
  await openPreview(page, "tabs")
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
  await openPreview(page, "checkbox")

  const checkbox = page.getByRole("checkbox", {
    name: "Accept terms and conditions",
  })

  await checkbox.focus()
  await page.keyboard.press("Space")
  await expect(checkbox).toBeChecked()

  await page.keyboard.press("Space")
  await expect(checkbox).not.toBeChecked()
})

test("detached handles stay scoped to each preview", async ({ page }) => {
  const warnings: string[] = []
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text())
  })

  await openPreview(page, "tooltip")
  await expect(page.getByRole("button", { name: "Hover me" })).toBeVisible()

  expect(warnings).not.toContainEqual(
    expect.stringContaining(
      "A handle is attached to more than one mounted root",
    ),
  )
})

test("toast appears after trigger click", async ({ page }) => {
  await openPreview(page, "toast")
  await page.getByRole("button", { name: "Default Toast" }).click()

  await expect(page.getByText("Event has been created")).toBeVisible()
})

test("accordion exposes expanded state", async ({ page }) => {
  await openPreview(page, "accordion")
  const accordion = page.getByRole("button", { name: "What is Base UI?" })
  await accordion.focus()
  await page.keyboard.press("Enter")
  await expect(accordion).toHaveAttribute("aria-expanded", "true")
  await expect(
    page.getByText("Base UI is a library", { exact: false }),
  ).toBeVisible()
})

test("collapsible exposes expanded state", async ({ page }) => {
  await openPreview(page, "collapsible")
  const collapsible = page.getByRole("button", { name: "Show recovery keys" })
  await collapsible.focus()
  await page.keyboard.press("Space")
  await expect(collapsible).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText("4829-1735-6621")).toBeVisible()
})

test("switch supports keyboard state changes", async ({ page }) => {
  await openPreview(page, "switch")
  const switchControl = page.getByRole("switch", { name: "Marketing emails" })
  await switchControl.focus()
  await page.keyboard.press("Space")
  await expect(switchControl).toBeChecked()
})

test("toggle supports keyboard state changes", async ({ page }) => {
  await openPreview(page, "toggle")
  const toggle = page.getByRole("button", { name: "Toggle", exact: true })
  await toggle.focus()
  await page.keyboard.press("Space")
  await expect(toggle).toHaveAttribute("aria-pressed", "true")
})

test("radio group supports keyboard state changes", async ({ page }) => {
  await openPreview(page, "radio-group")
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
  await openPreview(page, "select")
  const trigger = page.getByRole("combobox", { name: "Select framework" })
  await trigger.focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(trigger).toContainText("Vite")
  await expect(trigger).toBeFocused()
})
