import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("native Enter and Shift+Enter remain tracked through review decisions", async ({
  page,
}) => {
  test.slow()
  const pageErrors: string[] = []

  page.on("pageerror", (cause) => pageErrors.push(cause.message))
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  const panel = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("First paragraph")
  await page.getByRole("button", { name: "Suggest edits", exact: true }).click()
  await editor.click()
  await editor.press("End")
  await editor.press("Enter")
  await editor.pressSequentially("Second paragraph")
  await editor.press("Shift+Enter")
  await editor.pressSequentially("Soft line")

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await expect(editor.locator("p")).toHaveCount(2)
  await expect(editor.locator("p").nth(0)).toContainText("First paragraph")
  await expect(editor.locator("p").nth(1)).toContainText("Second paragraph")
  await expect(editor.locator("p").nth(1).locator("br")).toHaveCount(1)
  await expect(
    panel.getByRole("button", { name: "Accept all suggestions", exact: true }),
  ).toBeEnabled()
  await panel
    .getByRole("button", { name: "Go to suggestion", exact: true })
    .last()
    .click()
  await expect(editor).toBeFocused()

  await panel
    .getByRole("button", { name: "Accept all suggestions", exact: true })
    .click()

  await expect(editor.locator("p")).toHaveCount(2)
  await expect(editor.locator("p").nth(1).locator("br")).toHaveCount(1)
  await expect(
    panel.getByRole("button", { name: "Accept all suggestions", exact: true }),
  ).toHaveCount(0)
  expect(pageErrors).toEqual([])
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("review controls refresh after host permission and editability changes", async ({
  page,
}) => {
  await page.goto("/components/editor-review")

  const editor = page.getByRole("textbox", {
    name: "Review document",
    exact: true,
  })

  const mode = page.getByRole("button", { name: "Suggest edits", exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(mode).toBeEnabled()
  await page
    .getByRole("button", { name: "Deny review actions", exact: true })
    .click()
  await expect(mode).toBeDisabled()
  await page
    .getByRole("button", { name: "Allow review actions", exact: true })
    .click()
  await expect(mode).toBeEnabled()
  await page
    .getByRole("button", { name: "Remove reviewer", exact: true })
    .click()
  await expect(mode).toBeDisabled()
  await page
    .getByRole("button", { name: "Restore reviewer", exact: true })
    .click()
  await expect(mode).toBeEnabled()
  await page
    .getByRole("button", { name: "Read-only document", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(mode).toBeDisabled()
  await page
    .getByRole("button", { name: "Read-only document", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(mode).toBeEnabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
