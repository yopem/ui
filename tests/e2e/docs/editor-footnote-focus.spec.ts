import type { Locator } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function clearFootnoteEditor(editor: Locator) {
  await editor.press("ControlOrMeta+a")
  await editor.press("Backspace")
  await expect(editor).toHaveText("")
}

test("@a11y footnote suggestions preserve native focus and keyboard insertion", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []

  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/editor/footnote-typeahead")

  const editor = page.getByRole("textbox", {
    name: "Footnote editor",
    exact: true,
  })

  const suggestions = page.getByRole("listbox", {
    name: "Footnote suggestions",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).not.toHaveAttribute("aria-expanded")
  await clearFootnoteEditor(editor)
  await editor.pressSequentially("Native words")
  await editor.press("Enter")
  await editor.pressSequentially("Second line")
  await expect(editor.locator("p")).toHaveText(["Native words", "Second line"])
  await expect(editor).toBeFocused()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await clearFootnoteEditor(editor)
    await editor.pressSequentially("[^")
    await expect(suggestions).toBeVisible()
    await expect(suggestions.getByRole("option").first()).toBeVisible()
    const listId = await suggestions.getAttribute("id")

    if (!listId) throw new Error("Footnote listbox has no ID")
    await expect(editor).toHaveAttribute("aria-controls", listId)
    await expect(editor).toBeFocused()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.keyboard.press("Escape")
    await expect(suggestions).toBeHidden()
    await expect(editor).not.toHaveAttribute("aria-controls")
    await expect(editor).not.toHaveAttribute("aria-activedescendant")
    await expect(editor).toBeFocused()
    await expect(editor).toHaveText("[^")
  }

  await clearFootnoteEditor(editor)
  await editor.pressSequentially("[^")
  await expect(suggestions.getByRole("option").first()).toBeVisible()
  await page.keyboard.press("Tab")
  await expect(suggestions).toBeHidden()
  await expect(editor).not.toBeFocused()
  expect(
    await page.evaluate(() => {
      const active = document.activeElement

      return (
        active !== null &&
        active !== document.body &&
        active.isConnected &&
        active.closest('[aria-hidden="true"]') === null
      )
    }),
  ).toBe(true)

  await editor.click()
  await clearFootnoteEditor(editor)
  await editor.pressSequentially("[^")
  await expect(suggestions.getByRole("option").first()).toBeVisible()
  await page.keyboard.press("Enter")
  await expect(suggestions).toBeHidden()
  await expect(editor.locator("[data-editor-footnote-reference]")).toHaveCount(
    1,
  )
  await expect(editor.locator("[data-editor-footnote-definition]")).toHaveCount(
    1,
  )
  await expect(editor).toBeFocused()
  await page.keyboard.type("After reference")
  await expect(editor).toContainText("After reference")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(errors).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath("footnote-keyboard-focus.png"),
    scale: "css",
  })
})

test("filtered footnote suggestions keep a valid active descendant", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/editor/footnote-typeahead")

  const editor = page.getByRole("textbox", {
    name: "Footnote editor",
    exact: true,
  })

  const suggestions = page.getByRole("listbox", {
    name: "Footnote suggestions",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await clearFootnoteEditor(editor)

  for (const identifier of ["alpha", "beta"]) {
    await editor.locator("p").first().click()
    await page.keyboard.press("End")
    await page.keyboard.type(` [^${identifier}`)
    await expect(
      suggestions.getByRole("option", {
        name: new RegExp(`^Create footnote \\[\\^${identifier}\\](?:\\s|$)`),
      }),
    ).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(suggestions).toBeHidden()
  }

  await expect(editor.locator("[data-editor-footnote-definition]")).toHaveCount(
    2,
  )
  await editor.locator("p").first().click()
  await page.keyboard.press("End")
  await page.keyboard.type(" [^")
  await expect(suggestions.getByRole("option")).toHaveCount(3)

  const label = await suggestions
    .getByRole("option")
    .last()
    .getAttribute("aria-label")

  const identifier = label?.startsWith("Footnote [^alpha]")
    ? "alpha"
    : label?.startsWith("Footnote [^beta]")
      ? "beta"
      : null

  if (!identifier) throw new Error("Expected an existing footnote option")

  const existing = suggestions.getByRole("option", {
    name: new RegExp(`^Footnote \\[\\^${identifier}\\](?:\\s|$)`),
  })

  await expect(existing).toBeVisible()
  await page.keyboard.type(identifier.slice(0, 2))
  await expect(existing).toBeVisible()
  await expect(suggestions.getByRole("option")).toHaveCount(2)
  await page.keyboard.press("ArrowDown")
  await expect(existing).toHaveAttribute("aria-selected", "true")
  const activeId = await existing.getAttribute("id")

  if (!activeId) throw new Error("Selected footnote option has no ID")
  await expect(editor).toHaveAttribute("aria-activedescendant", activeId)
  await expect(editor).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(suggestions).toBeHidden()
  await expect(
    editor.locator(`[data-editor-footnote-reference="${identifier}"]`),
  ).toHaveCount(2)
  await expect(editor.locator("[data-editor-footnote-definition]")).toHaveCount(
    2,
  )
  await expect(editor).toBeFocused()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  expect(errors).toEqual([])
  await testInfo.attach("filtered-footnotes.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
