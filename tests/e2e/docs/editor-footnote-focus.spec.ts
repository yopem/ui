import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

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

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await editor.fill("")
    await editor.pressSequentially("[^")
    await expect(suggestions).toBeVisible()
    await expect(suggestions.getByRole("option").first()).toBeVisible()
    await expect(editor).toBeFocused()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.keyboard.press("Escape")
    await expect(suggestions).toBeHidden()
    await expect(editor).toBeFocused()
    await expect(editor).toHaveText("[^")
  }

  await editor.fill("")
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
  await editor.fill("")
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
