import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("link control creates and edits selected links safely", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/editor/link-control")

  const preview = page.getByRole("group", {
    name: "EditorLinkControl live preview",
    exact: true,
  })

  const editor = preview
    .getByRole("textbox")
    .and(preview.locator("[contenteditable]"))
    .first()

  const toolbar = preview.getByRole("toolbar", { name: "Formatting" })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Original label")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Link", exact: true }).click()

  let popup = page.getByRole("dialog", { name: "Link", exact: true })
  const url = popup.getByRole("textbox", { name: "Link URL", exact: true })
  const text = popup.getByRole("textbox", { name: "Link text", exact: true })

  await expect(url).toHaveValue("")
  await expect(text).toHaveValue("Original label")
  await url.fill("https://old.example")
  expect(
    (await new AxeBuilder({ page }).include('[role="dialog"]').analyze())
      .violations,
  ).toEqual([])
  await popup.getByRole("button", { name: "Apply link", exact: true }).click()

  let link = editor.getByRole("link", {
    name: "Original label",
    exact: true,
  })

  await expect(link).toHaveAttribute("href", "https://old.example")
  await link.selectText()
  await toolbar.getByRole("button", { name: "Link", exact: true }).click()

  popup = page.getByRole("dialog", { name: "Link", exact: true })

  const editUrl = popup.getByRole("textbox", {
    name: "Link URL",
    exact: true,
  })

  const editText = popup.getByRole("textbox", {
    name: "Link text",
    exact: true,
  })

  await expect(editUrl).toHaveValue("https://old.example")
  await expect(editText).toHaveValue("Original label")
  await editUrl.fill("javascript:alert(1)")
  await popup.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(popup.getByRole("alert")).toBeVisible()
  await expect(link).toHaveAttribute("href", "https://old.example")
  await expect(link).toHaveText("Original label")

  await editUrl.fill("https://new.example")
  await editText.fill("")
  await popup.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(popup.getByRole("alert")).toBeVisible()
  await expect(link).toHaveAttribute("href", "https://old.example")
  await editText.fill("Updated label")
  await popup.getByRole("checkbox", { name: "Open in new tab" }).check()
  await popup.getByRole("button", { name: "Apply link", exact: true }).click()

  link = editor.getByRole("link", { name: "Updated label", exact: true })
  await expect(link).toHaveAttribute("href", "https://new.example")
  await expect(link).toHaveAttribute("target", "_blank")
  await expect(link).toHaveAttribute("rel", /noopener/)
  await expect(link).toHaveAttribute("rel", /noreferrer/)
  await expect(editor).toBeFocused()
  await testInfo.attach("editor-link-control-after-edit.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("link control stays disabled in read-only editor", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/editor/examples#public-playground")

  const example = page.getByTestId("editor-example-public-playground")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const workspace = page.getByTestId("public-playground-workspace")

  const editor = workspace.getByRole("textbox", {
    name: "Integrated playground editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])

  async function copyNativeState() {
    await page.evaluate(() =>
      navigator.clipboard.writeText("Native document pending"),
    )
    await workspace
      .getByRole("button", { name: "Copy native JSON", exact: true })
      .click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .not.toBe("Native document pending")

    return page.evaluate(() => navigator.clipboard.readText())
  }

  const before: unknown = JSON.parse(await copyNativeState())

  await workspace
    .getByRole("button", { name: "Make editor read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    workspace.getByRole("button", { name: "Link", exact: true }),
  ).toBeDisabled()
  const after: unknown = JSON.parse(await copyNativeState())
  expect(after).toEqual(before)
  await testInfo.attach("editor-link-control-read-only.json", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  })
  await testInfo.attach("editor-link-control-read-only.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
