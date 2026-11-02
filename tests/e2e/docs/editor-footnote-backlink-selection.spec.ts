import { expect, test } from "@playwright/test"

test("backlink selects only its reference and keeps other references through deletion and undo", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/footnote-typeahead")

  const editor = page.getByRole("textbox", {
    name: "Footnote editor",
    exact: true,
  })

  const references = editor.locator('[data-editor-footnote-reference="1"]')
  const definitions = editor.locator("[data-editor-footnote-definition]")
  await expect(references).toHaveCount(2)
  const firstId = await references.first().getAttribute("id")
  const secondId = await references.nth(1).getAttribute("id")

  if (!firstId || !secondId) throw new Error("Reference IDs are missing")
  const beforeDefinitions = await definitions.allTextContents()
  await page
    .getByRole("button", { name: "Footnote backlinks", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Back to reference 2", exact: true })
    .click()
  await expect(editor).toBeFocused()
  await page.keyboard.press("Backspace")
  await expect(references).toHaveCount(1)
  await expect(references.first()).toHaveAttribute("id", firstId)
  expect(await definitions.allTextContents()).toEqual(beforeDefinitions)
  await editor.press("ControlOrMeta+z")
  await expect(references).toHaveCount(2)
  await expect(references.nth(1)).toHaveAttribute("id", secondId)
  expect(await definitions.allTextContents()).toEqual(beforeDefinitions)
  await testInfo.attach("reference-selection.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("native host cancellation keeps backlink popup and destination unchanged", async ({
  page,
}) => {
  await page.goto("/editor/footnote-typeahead")

  const editor = page.getByRole("textbox", {
    name: "Footnote editor",
    exact: true,
  })

  await editor.click()
  await page
    .getByRole("button", { name: "Footnote backlinks", exact: true })
    .click()

  const backlink = page.getByRole("button", {
    name: "Back to reference 2",
    exact: true,
  })

  await backlink.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
    })
  })
  await backlink.click()
  await expect(backlink).toBeVisible()
  await expect(
    editor.locator('[data-editor-footnote-reference="1"]'),
  ).toHaveCount(2)
  await page.keyboard.press("Escape")
  await expect(backlink).toBeHidden()
})
