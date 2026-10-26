import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-autoformat")
  const example = page.getByTestId("editor-example-public-autoformat")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", { name: "Host input rules", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("host input rules extend native typing and keep isolated history", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-public-autoformat")
  const host = example.getByTestId("host-input-rule-example")

  const editor = host.getByRole("textbox", {
    name: "Host input rules",
    exact: true,
  })

  await editor.pressSequentially("(ok)")
  await expect(editor).toHaveText("✓")
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("(ok)")
  await host.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor).toHaveText("✓")
  await expect(
    example.getByRole("textbox", { name: "Extended input rules", exact: true }),
  ).toHaveText("")
})

test("host rules can omit the extended defaults and preserve literal code", async ({
  page,
}) => {
  const host = page.getByTestId("host-input-rule-example")

  const editor = host.getByRole("textbox", {
    name: "Host input rules",
    exact: true,
  })

  await editor.pressSequentially("->")
  await expect(editor).toHaveText("->")
  await editor.fill("")
  await host.getByRole("button", { name: "Inline code", exact: true }).click()
  await editor.pressSequentially("(ok)")
  await expect(editor).toHaveText("(ok)")
  await expect(editor.locator("code")).toHaveText("(ok)")
})

test("host rules preserve clipboard text, read-only content and remount cleanup", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-public-autoformat")
  const host = example.getByTestId("host-input-rule-example")

  const editor = host.getByRole("textbox", {
    name: "Host input rules",
    exact: true,
  })

  await editor.click()
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData("text/plain", "(ok)")
    element.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    )
  })
  await expect(editor).toHaveText("(ok)")
  await example
    .getByRole("button", {
      name: "Make input-rule editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await editor.click()
  await page.keyboard.type("(ok)")
  await expect(editor).toHaveText("(ok)")
  await example
    .getByRole("button", { name: "Enable input-rule editing", exact: true })
    .click()
  await example
    .getByRole("button", { name: "Reset input-rule document", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.pressSequentially("(ok)(ok)")
  await expect(editor).toHaveText("✓✓")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-autoformat"]')
    .analyze()

  expect(report.violations).toEqual([])
})
