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
  const dialog = page.getByRole("dialog", { name: "Edit reservation" })
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
  const input = page.getByPlaceholder("Search station tools...")
  await expect(input).toBeFocused()
  await input.fill("Field notebook")
  await page.getByRole("option", { name: /Field notebook/ }).click()
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

test("progress advances and restarts after navigation", async ({ page }) => {
  await openPreview(page, "progress")
  const progress = page.getByRole("progressbar", { name: "Upload progress" })
  await expect
    .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
    .toBeGreaterThan(20)

  await page.goto("/components/skeleton", { waitUntil: "commit" })
  await page.goto("/components/progress", { waitUntil: "commit" })
  await expect(progress).toHaveAttribute("aria-valuenow", "20")
  await expect
    .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
    .toBeGreaterThan(20)
})

test("skeleton preview replaces loading placeholders", async ({ page }) => {
  await page.goto("/components/skeleton", { waitUntil: "commit" })
  await expect(page.locator('[data-slot="skeleton"]')).not.toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Copy Skeleton usage", exact: true }),
  ).toBeEnabled()
  await expect(page.getByRole("heading", { name: "Nora Ellis" })).toBeVisible({
    timeout: 6000,
  })
  await expect(page.getByRole("heading", { name: "Ivo Chen" })).toBeVisible({
    timeout: 6000,
  })
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
})

test("tabs support arrow-key navigation", async ({ page }) => {
  await openPreview(page, "tabs")
  const firstTab = page.getByRole("tab", { name: "Meeting point" })
  const secondTab = page.getByRole("tab", { name: "Equipment" })

  await firstTab.focus()
  await page.keyboard.press("ArrowRight")
  await expect(secondTab).toBeFocused()

  await page.keyboard.press("Enter")
  await expect(secondTab).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("tabpanel")).toBeVisible()
})

test("checkbox toggles with Space", async ({ page }) => {
  await openPreview(page, "checkbox")

  const checkbox = page.getByRole("checkbox", {
    name: "Include a printed trail map",
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

  await expect(
    page.getByRole("heading", { name: "Field visit reserved", exact: true }),
  ).toBeVisible()
})

test("accordion exposes expanded state", async ({ page }) => {
  await openPreview(page, "accordion")
  const accordion = page.getByRole("button", { name: "What can I borrow?" })
  await accordion.focus()
  await page.keyboard.press("Enter")
  await expect(accordion).toHaveAttribute("aria-expanded", "true")
  await expect(
    page.locator("[data-slot=accordion-panel]").first(),
  ).toBeVisible()
})

test("collapsible exposes expanded state", async ({ page }) => {
  await openPreview(page, "collapsible")
  const collapsible = page.getByRole("button", { name: "Show equipment codes" })
  await collapsible.focus()
  await page.keyboard.press("Space")
  await expect(collapsible).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText("KIT-BIRD-014")).toBeVisible()
})

test("switch supports keyboard state changes", async ({ page }, testInfo) => {
  await openPreview(page, "switch")

  const switchControl = page.getByRole("switch", {
    name: "Trail condition alerts",
  })

  const thumb = switchControl.locator('[data-slot="switch-thumb"]')
  const trackBounds = await switchControl.boundingBox()
  const uncheckedBounds = await thumb.boundingBox()

  if (!trackBounds || !uncheckedBounds) {
    throw new Error("Switch and thumb must have visible bounds")
  }

  const startInset = uncheckedBounds.x - trackBounds.x
  await switchControl.focus()
  await page.keyboard.press("Space")
  await expect(switchControl).toBeChecked()
  await expect
    .poll(async () => {
      const checkedBounds = await thumb.boundingBox()

      if (!checkedBounds) return Infinity

      const endInset =
        trackBounds.x +
        trackBounds.width -
        checkedBounds.x -
        checkedBounds.width

      return Math.abs(endInset - startInset)
    })
    .toBeLessThan(1)
  await testInfo.attach("checked-switch", {
    body: await switchControl.screenshot(),
    contentType: "image/png",
  })
  await page.keyboard.press("Space")
  await expect(switchControl).not.toBeChecked()
  await expect
    .poll(async () => (await thumb.boundingBox())?.x)
    .toBe(uncheckedBounds.x)
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
  const birdwatching = page.getByRole("radio", { name: "Birdwatching" })
  const audio = page.getByRole("radio", { name: "Audio recording" })
  await birdwatching.focus()
  await page.keyboard.press("ArrowDown")
  await expect(audio).toBeChecked()
  await expect(audio).toBeFocused()
})

test("select supports keyboard selection and restores focus", async ({
  page,
}) => {
  await openPreview(page, "select")
  const trigger = page.getByRole("combobox", { name: "Select equipment" })
  await trigger.focus()
  await page.keyboard.press("ArrowDown")
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(trigger).toContainText("Audio recording")
  await expect(trigger).toBeFocused()
})
