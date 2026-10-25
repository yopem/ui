import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function openExample(page: Page) {
  await page.goto("/editor/examples#public-plugin-rules")
  const example = page.getByTestId("editor-example-public-plugin-rules")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Native block behavior",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { example, editor }
}

test("middle-heading Enter creates a paragraph and native Undo restores the heading", async ({
  page,
}) => {
  const { example, editor } = await openExample(page)
  await editor.locator("h2").click()
  await page.keyboard.press("Home")

  for (let index = 0; index < 6; index += 1)
    await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect.poll(() => editor.locator("h2").textContent()).toBe("Split ")
  await expect(editor.locator("h2 + p")).toHaveText("this heading")
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor.locator("h2")).toHaveText("Split this heading")
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-plugin-rules"]')
        .analyze()
    ).violations,
  ).toEqual([])
  await expect(example.getByRole("alert")).toHaveCount(0)
})

test("native list and empty-code Backspace retain content and history", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  await editor.locator("li").first().click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Backspace")
  await expect(
    editor.locator("p").filter({ hasText: "Native list boundary" }),
  ).toHaveCount(1)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor.locator("li").first()).toHaveText("Native list boundary")
  await editor.locator('code[spellcheck="false"]').click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Backspace")
  await expect(editor.locator('code[spellcheck="false"]')).toHaveCount(0)
})

test("inline arrow boundaries do not transfer code or superscript to following text", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  const paragraph = editor.locator("p").filter({ hasText: "Inline code then" })
  await paragraph.click({ position: { x: 1, y: 1 } })
  await page.keyboard.press("Home")

  for (
    let offset = 0;
    offset < "Inline code then superscript".length;
    offset += 1
  ) {
    await page.keyboard.press("ArrowRight")
  }

  await page.keyboard.press("ArrowRight")
  await page.keyboard.insertText(" plain-after-super ")
  await expect(editor.locator("sup")).not.toContainText("plain-after-super")
  await expect(
    editor.locator("p").filter({ hasText: "plain-after-super" }),
  ).toHaveCount(1)
})

test("host read-only disables block behavior without changing content", async ({
  page,
}) => {
  const { example, editor } = await openExample(page)
  const before = await editor.innerText()
  await example
    .getByRole("button", {
      name: "Make behavior editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await editor.click()
  await page.keyboard.press("Enter")
  await page.keyboard.press("Backspace")
  expect(await editor.innerText()).toBe(before)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-plugin-rules"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("nested quote Enter retains the outer container and neighboring content", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  await editor.locator("blockquote blockquote").click()
  await page.keyboard.press("End")
  await page.keyboard.press("Enter")
  await page.keyboard.insertText("After nested quote")
  await expect(editor.locator("blockquote blockquote")).toHaveText(
    "Nested native quote",
  )
  await expect(editor.locator("blockquote > p")).toContainText(
    "After nested quote",
  )
  await expect(editor.locator("h2")).toHaveText("Split this heading")
})

test("native link deletion unwraps an empty inline wrapper", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  await editor.getByRole("link", { name: "Reference", exact: true }).dblclick()
  await page.keyboard.press("Backspace")
  await expect(
    editor.getByRole("link", { name: "Reference", exact: true }),
  ).toHaveCount(0)
  await expect(
    editor.locator("p").filter({ hasText: "Inline code then" }),
  ).toContainText("after")
  await page.keyboard.press("ControlOrMeta+z")
  await expect(
    editor.getByRole("link", { name: "Reference", exact: true }),
  ).toHaveCount(1)
})

test("native Backspace selects a rule before deletion and Undo restores it", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  await editor.locator("p").filter({ hasText: "After native rule" }).click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Backspace")
  await expect(editor.locator("hr")).toHaveCount(1)
  await expect(editor).toContainText("After native rule")
  await page.keyboard.press("Backspace")
  await expect(editor.locator("hr")).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor.locator("hr")).toHaveCount(1)
})
