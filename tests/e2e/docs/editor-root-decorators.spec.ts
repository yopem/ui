import { expect, test } from "@playwright/test"

test("decorated date controls receive their root and current editability", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/editor/examples#public-optional-document")
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()
  await page
    .getByTestId("editor-example-public-optional-document")
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const example = page.getByTestId("public-optional-document")

  const editor = example.getByRole("textbox", {
    name: "Optional codecs editor",
    exact: true,
  })

  const date = editor.getByRole("button", {
    name: "Choose date 2024-02-29",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(date).toBeEnabled()
  await example
    .getByRole("button", { name: "Make editor read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(date).toBeDisabled()
  await example
    .getByRole("button", { name: "Enable editor", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(date).toBeEnabled()
  expect(errors).toEqual([])
  await testInfo.attach("decorated-root.html", {
    body: await example.innerHTML(),
    contentType: "text/html",
  })
})
