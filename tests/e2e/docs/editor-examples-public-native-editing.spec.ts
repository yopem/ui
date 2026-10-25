import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/editor/examples#public-native-editing")
  const example = page.getByTestId("editor-example-public-native-editing")
  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
})

test("basic-blocks: edits native headings, quote, code, style and history", async ({
  page,
}) => {
  const blocks = page.getByRole("region", {
    name: "Block editing",
    exact: true,
  })

  const editor = blocks.getByRole("textbox", {
    name: "Native block editor",
    exact: true,
  })

  const toolbar = blocks.getByRole("toolbar", {
    name: "Native block tools",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Native block")

  for (const level of [1, 2, 3, 4, 5, 6] as const) {
    await editor.press("ControlOrMeta+a")
    await toolbar
      .getByRole("button", { name: `Heading ${level}`, exact: true })
      .click()
    await expect(editor.locator(`h${level}`)).toHaveText("Native block")
  }

  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Quote", exact: true }).click()
  await expect(editor.locator("blockquote")).toHaveText("Native block")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Code block", exact: true }).click()
  await expect(editor.locator("pre")).toContainText("Native block")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("blockquote")).toHaveText("Native block")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("pre")).toContainText("Native block")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Paragraph", exact: true }).click()

  await editor.fill("Styled block")
  await editor.press("ControlOrMeta+a")
  await toolbar
    .getByRole("button", { name: "Align center", exact: true })
    .click()
  await expect(editor.locator("p")).toHaveCSS("text-align", "center")
  await editor.press("ControlOrMeta+a")
  await toolbar
    .getByRole("button", { name: "Line height", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "Line height value", exact: true })
    .fill("2")
  await page
    .getByRole("button", { name: "Apply Line height", exact: true })
    .click()
  await expect
    .poll(() =>
      editor.locator("p").evaluate((element) => element.style.lineHeight),
    )
    .toBe("2")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect
    .poll(() =>
      editor.locator("p").evaluate((element) => element.style.lineHeight),
    )
    .toBe("")
})

test("basic-blocks: inserts native horizontal rule and supports history", async ({
  page,
}) => {
  const blocks = page.getByRole("region", {
    name: "Block editing",
    exact: true,
  })

  const editor = blocks.getByRole("textbox", {
    name: "Native block editor",
    exact: true,
  })

  const toolbar = blocks.getByRole("toolbar", {
    name: "Native block tools",
    exact: true,
  })

  await editor.fill("Before rule")
  await editor.press("ControlOrMeta+End")
  await toolbar
    .getByRole("button", { name: "Insert horizontal rule", exact: true })
    .click()
  await expect(editor.getByRole("separator")).toHaveCount(1)
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.getByRole("separator")).toHaveCount(0)
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.getByRole("separator")).toHaveCount(1)
})

test("list: creates nested native bullet and numbered lists", async ({
  page,
}) => {
  const lists = page.getByRole("region", { name: "Native lists", exact: true })

  const editor = lists.getByRole("textbox", {
    name: "Native list editor",
    exact: true,
  })

  const toolbar = lists.getByRole("toolbar", {
    name: "Native list tools",
    exact: true,
  })

  await editor.fill("First item")
  await editor.press("End")
  await editor.press("Enter")
  await editor.pressSequentially("Second item")
  await editor.press("ControlOrMeta+a")
  await toolbar
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await expect(editor.locator("ul > li")).toHaveCount(2)
  await editor.locator("ul > li").nth(1).click()
  await toolbar.getByRole("button", { name: "Indent", exact: true }).click()
  await expect(editor.locator("ul > li > ul > li")).toHaveCount(1)
  await toolbar.getByRole("button", { name: "Outdent", exact: true }).click()
  await expect(editor.locator("ul > li")).toHaveCount(2)
  await editor.locator("ul > li").first().click()
  await toolbar
    .getByRole("button", { name: "Numbered list", exact: true })
    .click()
  await expect(editor.locator("ol > li")).toHaveCount(2)
  await expect(editor).toContainText("First item")
  await expect(editor).toContainText("Second item")
})

test("list-classic: supports nested native list keyboard indentation", async ({
  page,
}) => {
  const lists = page.getByRole("region", { name: "Native lists", exact: true })

  const editor = lists.getByRole("textbox", {
    name: "Native list editor",
    exact: true,
  })

  const toolbar = lists.getByRole("toolbar", {
    name: "Native list tools",
    exact: true,
  })

  await editor.fill("Parent item")
  await editor.press("End")
  await editor.press("Enter")
  await editor.pressSequentially("Child item")
  await editor.press("ControlOrMeta+a")
  await toolbar
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await editor.locator("ul > li").nth(1).click()
  await page.keyboard.press("Tab")
  await expect(editor.locator("ul > li > ul > li")).toHaveCount(1)
  await page.keyboard.press("Shift+Tab")
  await expect(editor.locator("ul > li")).toHaveCount(2)
})

test("list: toggles native checklist state and restores it with undo", async ({
  page,
}) => {
  const checklist = page.getByRole("region", {
    name: "Native checklist",
    exact: true,
  })

  const editor = checklist.getByRole("textbox", {
    name: "Native checklist editor",
    exact: true,
  })

  const toolbar = checklist.getByRole("toolbar", {
    name: "Native checklist tools",
    exact: true,
  })

  await editor.fill("Checklist task")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Checklist", exact: true }).click()

  const checkbox = editor.getByRole("checkbox", {
    name: "Checklist task",
    exact: true,
  })

  await expect(checkbox).not.toBeChecked()
  await checkbox.click()
  await expect(checkbox).toBeChecked()
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(checkbox).not.toBeChecked()
})

test("autoformat: applies native Markdown heading and inline mark shortcuts", async ({
  page,
}) => {
  const shortcuts = page.getByRole("region", {
    name: "Markdown shortcuts",
    exact: true,
  })

  const editor = shortcuts.getByRole("textbox", {
    name: "Markdown shortcut editor",
    exact: true,
  })

  await editor.click()
  await editor.pressSequentially("# ")
  await editor.pressSequentially("Shortcut heading")
  await expect(editor.locator("h1")).toHaveText("Shortcut heading")
  await editor.press("Enter")
  await editor.pressSequentially("**Marked text**")
  await expect(editor.locator("strong, b")).toHaveText("Marked text")
})

test("public native editing: exposes accessible editor controls", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-public-native-editing")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-native-editing"]')
    .analyze()

  expect(report.violations).toEqual([])
  await expect(
    example.getByRole("textbox", { name: "Native block editor", exact: true }),
  ).toBeVisible()
  await expect(
    example.getByRole("textbox", { name: "Native list editor", exact: true }),
  ).toBeVisible()
  await expect(
    example.getByRole("textbox", {
      name: "Native checklist editor",
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    example.getByRole("textbox", {
      name: "Markdown shortcut editor",
      exact: true,
    }),
  ).toBeVisible()
})
