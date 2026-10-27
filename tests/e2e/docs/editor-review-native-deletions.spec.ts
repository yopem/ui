import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const direction of ["backward", "forward"] as const) {
  for (const decision of ["accept", "reject"] as const) {
    test(`native ${direction} word deletion supports review ${decision} and history`, async ({
      page,
    }) => {
      test.slow()
      const errors: string[] = []
      const original = "First second"

      const position =
        direction === "backward" ? "ControlOrMeta+End" : "ControlOrMeta+Home"

      const wordModifier = process.platform === "darwin" ? "Alt" : "Control"
      const deletion = `${wordModifier}+${direction === "backward" ? "Backspace" : "Delete"}`

      page.on("pageerror", (cause) => errors.push(cause.message))
      await page.goto("/components/editor-review")

      const editor = page.getByRole("textbox", {
        name: "Review document",
        exact: true,
      })

      const panel = page.getByRole("complementary", {
        name: "Document review",
        exact: true,
      })

      const suggestions = panel.getByRole("button", {
        name: "Go to suggestion",
        exact: true,
      })

      await expect(editor).toHaveAttribute("contenteditable", "true")
      await editor.fill(original)
      await editor.press(position)
      await editor.press(deletion)
      await expect.poll(() => editor.innerText()).not.toBe(original)
      const nativeResult = await editor.innerText()

      await editor.fill(original)
      await page
        .getByRole("button", { name: "Suggest edits", exact: true })
        .click()
      await editor.click()
      await editor.press(position)
      await editor.press(deletion)
      await expect(suggestions).toHaveCount(1)
      await expect.poll(() => editor.innerText()).toBe(original)
      await panel
        .getByRole("button", {
          name: `${decision === "accept" ? "Accept" : "Reject"} all suggestions`,
          exact: true,
        })
        .click()
      await expect(suggestions).toHaveCount(0)
      await expect
        .poll(() => editor.innerText())
        .toBe(decision === "accept" ? nativeResult : original)
      await editor.press("ControlOrMeta+z")
      await expect(suggestions).toHaveCount(1)
      await expect.poll(() => editor.innerText()).toBe(original)
      await editor.press("ControlOrMeta+Shift+z")
      await expect(suggestions).toHaveCount(0)
      await expect
        .poll(() => editor.innerText())
        .toBe(decision === "accept" ? nativeResult : original)
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
      expect(errors).toEqual([])
    })
  }
}
