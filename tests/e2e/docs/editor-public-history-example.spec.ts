import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("revision snapshots stay immutable and expose block/text changes @a11y", async ({
  page,
}, info) => {
  test.slow()
  await page.goto("/editor/examples#version-history")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const example = page.getByTestId("editor-example-version-history")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Current revision editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await example
    .getByRole("button", { name: "Save revision", exact: true })
    .click()
  await editor.press("ControlOrMeta+Home")
  await editor.press("End")
  await editor.pressSequentially(" changed")
  await example
    .getByRole("button", { name: "Save revision", exact: true })
    .click()
  await example
    .getByRole("combobox", { name: "Saved revision", exact: true })
    .selectOption("revision-1")

  const saved = example.getByRole("textbox", {
    name: "Revision document",
    exact: true,
  })

  await expect(saved).toHaveAttribute("contenteditable", "false")
  await expect(saved).not.toContainText("changed")
  await expect(editor).toContainText("changed")
  await expect(
    example
      .getByTestId("revision-changes")
      .getByText("Updated block", { exact: true }),
  ).toBeVisible()
  await expect(example.locator('[data-change="insert"]')).toContainText(
    " changed",
  )
  await editor.press("ControlOrMeta+End")
  await editor.press("Enter")
  await editor.pressSequentially("Inserted paragraph")
  await expect(
    example
      .getByTestId("revision-changes")
      .getByText("Inserted block", { exact: true }),
  ).toBeVisible()
  await editor.press("ControlOrMeta+Home")
  await editor.press("ArrowDown")
  await editor.press("Home")
  await editor.press("Shift+End")
  await editor.press("Backspace")
  await editor.press("Backspace")
  await expect(
    example
      .getByTestId("revision-changes")
      .getByText("Removed block", { exact: true }),
  ).toBeVisible()
  await expect(saved).not.toContainText("Inserted paragraph")

  const results = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-version-history"]')
    .analyze()

  expect(results.violations).toEqual([])
  await info.attach("revision-history-axe.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  })
  await example.screenshot({
    path: info.outputPath("revision-history.png"),
    scale: "css",
  })
})

test("revision admission remains bounded without removing current content", async ({
  page,
}) => {
  test.slow()
  await page.goto("/editor/examples#version-history")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  const example = page.getByTestId("editor-example-version-history")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Current revision editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  const before = await editor.innerText()

  const save = example.getByRole("button", {
    name: "Save revision",
    exact: true,
  })

  for (let index = 0; index < 20; index++) await save.click()
  await expect(save).toBeDisabled()
  await expect(
    example
      .getByRole("combobox", { name: "Saved revision", exact: true })
      .locator("option"),
  ).toHaveCount(20)
  await expect(editor).toHaveText(before)
})
