import { expect, test } from "@playwright/test"

test("nested native lists and tables survive disclosure, conversion and removal", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Blocks editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", { name: "Blocks", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await toolbar
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Native content")
  await editor.press("Enter")
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            "<ul><li>Nested list</li></ul><table><tbody><tr><td>Cell content</td></tr></tbody></table>",
          ],
          { type: "text/html" },
        ),
      }),
    ])
  })
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator("details li")).toContainText("Nested list")
  await expect(editor.locator("details td")).toContainText("Cell content")
  await editor.locator("td").click()
  await toolbar
    .getByRole("button", { name: "Toggle disclosure", exact: true })
    .click()
  await editor.pressSequentially(" repaired")
  await expect(editor.locator("[data-editor-toggle-summary]")).toContainText(
    "repaired",
  )
  await editor.locator("summary").focus()
  await editor.locator("summary").press("Space")
  await editor.locator("[data-editor-toggle-summary]").last().click()
  await toolbar
    .getByRole("button", { name: "Convert to callout", exact: true })
    .click()
  await expect(editor.locator("aside li")).toContainText("Nested list")
  await expect(editor.locator("aside td")).toContainText("Cell content")
  await toolbar
    .getByRole("button", { name: "Remove block", exact: true })
    .click()
  await expect(editor.locator("aside")).toHaveCount(0)
  await expect(editor.locator("li")).toContainText("Nested list")
  await expect(editor.locator("td")).toContainText("Cell content")
})
