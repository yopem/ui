import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("optional input rules substitute typed symbols and retain native Undo", async ({
  page,
}) => {
  test.slow()
  await page.goto("/editor/examples#public-autoformat")
  const example = page.getByTestId("editor-example-public-autoformat")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Extended input rules",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  const values = [
    ["(c)", "©"],
    ["1/2", "½"],
    ["->", "→"],
    ["!=", "≠"],
    ["^2", "²"],
    ["~3", "₃"],
    ['"hello"', "“hello”"],
  ] as const

  for (const [input, output] of values) {
    await editor.fill("")
    await editor.pressSequentially(input)
    await expect(editor).toHaveText(output)
  }

  await editor.fill("")
  await editor.pressSequentially("1/2")
  await expect(editor).toHaveText("½")
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("1/2")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-autoformat"]')
    .analyze()

  expect(report.violations).toEqual([])
})

test("optional input rules create nested quotes, todos and horizontal rules", async ({
  page,
}) => {
  test.slow()
  await page.goto("/editor/examples#public-autoformat")
  const example = page.getByTestId("editor-example-public-autoformat")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Extended input rules",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.pressSequentially(">> ")
  await editor.pressSequentially("Nested quote")
  await expect(editor.locator("blockquote blockquote")).toContainText(
    "Nested quote",
  )
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-autoformat"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await example
    .getByRole("button", { name: "Reset input-rule document", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.pressSequentially("[ ] ")
  await editor.pressSequentially("Todo item")
  await expect(editor.locator('input[type="checkbox"]')).toHaveCount(1)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-autoformat"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await example
    .getByRole("button", { name: "Reset input-rule document", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await editor.pressSequentially("---")
  await editor.press("Enter")
  await expect(editor.locator("hr")).toHaveCount(1)
  await editor.pressSequentially("After rule")
  await expect(editor).toContainText("After rule")
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-autoformat"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("optional input rules leave inline and block code literal and honor read-only", async ({
  page,
}) => {
  test.slow()
  await page.goto("/editor/examples#public-autoformat")
  const example = page.getByTestId("editor-example-public-autoformat")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Extended input rules",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await example.getByRole("button", { name: "Code", exact: true }).click()
  await editor.pressSequentially("(c) 1/2 ->")
  await expect(editor).toHaveText("(c) 1/2 ->")
  await example.getByRole("button", { name: "Code", exact: true }).click()
  await editor.fill("")
  await example.getByRole("button", { name: "Code block", exact: true }).click()
  await editor.pressSequentially("(c) 1/2 ->")
  await expect(editor.locator("code")).toContainText("(c) 1/2 ->")
  await example
    .getByRole("button", {
      name: "Make input-rule editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await editor.click()
  await page.keyboard.insertText(" changed")
  await expect(editor).not.toContainText("changed")
})

test("a one-character native paste does not run typed-text substitutions", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/editor/examples#public-autoformat")
  const example = page.getByTestId("editor-example-public-autoformat")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Extended input rules",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("1/")
  await editor.press("End")
  await page.evaluate(() => navigator.clipboard.writeText("2"))
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("1/2")
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("1/")
})
