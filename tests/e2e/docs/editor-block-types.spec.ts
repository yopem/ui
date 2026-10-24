import { expect, test } from "@playwright/test"

test("block type conversion keeps native content and undo", async ({
  page,
}) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Start")
  await toolbar
    .getByRole("button", { name: "Insert callout", exact: true })
    .click()
  await editor.pressSequentially("Rich content")
  await toolbar
    .getByRole("button", { name: "Convert to toggle", exact: true })
    .click()
  await expect(editor.locator("[data-editor-toggle]")).toContainText(
    "Rich content",
  )
  await editor.pressSequentially("New summary")
  await toolbar
    .getByRole("button", { name: "Convert to callout", exact: true })
    .click()
  await expect(editor.locator("aside")).toContainText("New summary")
  await expect(editor.locator("aside")).toContainText("Rich content")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("[data-editor-toggle]")).toContainText(
    "Rich content",
  )
})
