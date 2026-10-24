import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("callout host cancellation keeps document unchanged", async ({ page }) => {
  await page.goto("/editor/callout-button")

  const editor = page.getByRole("textbox", {
    name: "EditorCalloutButton preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep content")
  await page
    .getByRole("button", { name: "Cancelled callout", exact: true })
    .click()
  await expect(editor.locator("aside")).toHaveCount(0)
  await expect(editor).toHaveText("Keep content")
})

test("toggle title link, nested body and native disclosure @a11y", async ({
  page,
}, info) => {
  await page.goto("/editor/toggle-button")

  const preview = page.getByRole("group", {
    name: "EditorToggleButton live preview",
    exact: true,
  })

  const editor = preview.getByRole("textbox", {
    name: "EditorToggleButton preview",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await preview
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Title link")
  await editor.press("Home")
  await editor.press("Shift+End")
  await preview.getByRole("button", { name: "Link", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Link", exact: true })
  await dialog
    .getByRole("textbox", { name: "Link URL" })
    .fill("https://example.com")
  await dialog.getByRole("button", { name: "Apply link", exact: true }).click()
  const title = editor.locator("[data-editor-toggle-summary]").first()
  await expect(title.getByRole("link")).toHaveAttribute(
    "href",
    "https://example.com",
  )
  await editor.press("End")
  await editor.press("Enter")
  await editor.pressSequentially("Body")
  await preview
    .getByRole("button", { name: "Insert toggle", exact: true })
    .click()
  await editor.pressSequentially("Nested")
  await expect(editor.locator("details details")).toHaveCount(1)
  const summary = editor.locator("summary").first()
  await summary.focus()
  await summary.press("Space")
  await expect(editor.locator("details").first()).not.toHaveAttribute(
    "open",
    "",
  )
  await expect(title.getByRole("link")).toBeVisible()
  await expect(summary).toBeFocused()
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-slot="editor-part-preview"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await page.screenshot({
    path: info.outputPath("toggle-rich-title-closed.png"),
    fullPage: true,
    scale: "css",
  })
})
