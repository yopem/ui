import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

async function openPublicTypeaheadEditor(page: Page) {
  test.slow()
  await page.goto("/editor/examples#public-typeahead")
  const section = page.getByTestId("editor-example-public-typeahead")
  await section
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const example = section.getByTestId("public-typeahead-example")

  const editor = example.getByRole("textbox", {
    name: "Public typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { example, editor }
}

async function chooseSlashCommand(
  page: Page,
  editor: Locator,
  query: string,
  label: string,
) {
  await editor.click()
  await page.keyboard.type(query)
  const option = page.getByRole("option", { name: label, exact: true })
  await expect(option).toBeVisible()
  await option.click()
  await expect(editor).toBeFocused()
}

test("emoji: colon insertion shares bounded history with the full toolbar picker", async ({
  page,
}, testInfo) => {
  const { example, editor } = await openPublicTypeaheadEditor(page)

  const suggestions = page.getByRole("listbox", {
    name: "Public typeahead suggestions",
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type(":woman_technologist")
  await expect(
    suggestions.getByRole("option", {
      name: "woman technologist",
      exact: true,
    }),
  ).toBeVisible()
  await suggestions
    .getByRole("option", { name: "woman technologist", exact: true })
    .click()
  await expect(editor).toContainText("👩‍💻")
  await expect(editor).toBeFocused()

  await page.keyboard.type(" :no_such_emoji_9qz0")
  await expect(page.getByText("No suggestions", { exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(editor).toContainText(" :no_such_emoji_9qz0")
  await expect(editor).toBeFocused()
  await expect(suggestions).toHaveCount(0)

  await example.getByRole("button", { name: "Emoji", exact: true }).click()

  const picker = page.getByRole("dialog", {
    name: "Emoji picker",
    exact: true,
  })

  const emojiList = picker.getByRole("listbox", { name: "Emoji", exact: true })
  const firstPageItem = await emojiList.getByRole("option").first().innerText()

  await picker.getByRole("button", { name: "Next emoji", exact: true }).click()
  await expect(emojiList.getByRole("option").first()).not.toHaveText(
    firstPageItem,
  )
  await picker
    .getByRole("combobox", { name: "Emoji category", exact: true })
    .selectOption("frequent")
  await expect(
    emojiList.getByRole("option", {
      name: "👩‍💻 woman technologist",
      exact: true,
    }),
  ).toBeVisible()

  const report = await new AxeBuilder({ page })
    .include('[role="dialog"][aria-label="Emoji picker"]')
    .analyze()

  await testInfo.attach("public-typeahead-emoji-a11y.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])

  await picker.getByRole("button", { name: "Clear emoji history" }).click()
  await expect(emojiList.getByRole("option")).toHaveCount(0)
  await expect(
    picker.getByRole("button", { name: "Clear emoji history" }),
  ).toBeDisabled()
})

test("mention: bounded fixture search inserts an atomic identity through native clipboard", async ({
  page,
  context,
}, testInfo) => {
  const { editor } = await openPublicTypeaheadEditor(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const suggestions = page.getByRole("listbox", {
    name: "Public typeahead suggestions",
  })

  await editor.click()
  await page.keyboard.type("@Grace")
  await expect(
    page.getByText("Loading suggestions", { exact: true }),
  ).toBeVisible()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("@Ada")
  await expect(
    suggestions.getByRole("option", { name: "Ada Lovelace", exact: true }),
  ).toBeVisible()
  await expect(
    suggestions.getByRole("option", { name: "Grace Hopper", exact: true }),
  ).toHaveCount(0)

  const report = await new AxeBuilder({ page })
    .include('[data-slot="editor-inline-combobox-content"]')
    .analyze()

  await testInfo.attach("public-typeahead-mention-a11y.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await editor.press("ArrowDown")
  await editor.press("Enter")
  const mentions = editor.locator('[data-slot="editor-mention"]')

  await expect(mentions).toHaveCount(1)
  await expect(mentions.first()).toHaveText("@Ada Lovelace")
  await expect(editor).toBeFocused()
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+c")
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("@Ada Lovelace")
  await editor.press("End")
  await editor.press("ControlOrMeta+v")
  await expect(mentions).toHaveCount(2)
  await editor.press("ControlOrMeta+z")
  await expect(mentions).toHaveCount(1)
  await editor.press("Backspace")
  await expect(mentions).toHaveCount(0)
  await editor.press("ControlOrMeta+z")
  await expect(mentions).toHaveCount(1)
})

test("slash-command: Escape preserves query and heading action creates a native block", async ({
  page,
}, testInfo) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  const suggestions = page.getByRole("listbox", {
    name: "Public typeahead suggestions",
  })

  await editor.click()
  await page.keyboard.type("/heading 2")
  await expect(
    suggestions.getByRole("option", { name: "Heading 2", exact: true }),
  ).toBeVisible()

  const report = await new AxeBuilder({ page })
    .include('[data-slot="editor-inline-combobox-content"]')
    .analyze()

  await testInfo.attach("public-typeahead-slash-a11y.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(editor).toContainText("/heading 2")
  await expect(editor).toBeFocused()
  await expect(suggestions).toHaveCount(0)

  const reopened = await openPublicTypeaheadEditor(page)
  await chooseSlashCommand(page, reopened.editor, "/heading 2", "Heading 2")
  await page.keyboard.type("Public heading")
  await expect(
    reopened.editor.getByRole("heading", {
      name: "Public heading",
      exact: true,
    }),
  ).toBeVisible()
  await expect(reopened.editor).not.toContainText("/heading 2")
})

test("slash-command: TOC action inserts the native overview node", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/toc", "Table of contents")
  await expect(
    editor.getByRole("navigation", {
      name: "Table of contents",
      exact: true,
    }),
  ).toBeVisible()
})

test("slash-command: callout action inserts a native callout", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/callout", "Callout")
  await expect(editor.locator("aside[data-editor-callout]")).toBeVisible()
})

test("slash-command: toggle action inserts a native disclosure", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/toggle", "Toggle")
  await expect(
    editor.locator(
      "[data-editor-toggle] details[data-editor-toggle-body] summary[data-editor-toggle-control]",
    ),
  ).toBeVisible()
})

test("slash-command: columns action inserts two native columns", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/columns", "Two columns")
  const columns = editor.locator("[data-editor-columns]")

  await expect(columns).toBeVisible()
  await expect(columns.locator("[data-editor-column]")).toHaveCount(2)
})

test("slash-command: fixed date action inserts a native date", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/fixed date", "Fixed date")
  await expect(editor.locator('[data-editor-date="1"]')).toHaveAttribute(
    "datetime",
    "2025-01-15",
  )
})

test("slash-command: inline equation action inserts a native equation", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/inline equation", "Inline equation")
  await expect(
    editor.locator('[data-editor-math="inline"][data-editor-tex="x^2"]'),
  ).toBeVisible()
})

test("slash-command: block equation action inserts a native equation", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/block equation", "Block equation")
  await expect(
    editor.locator('[data-editor-math="block"][data-editor-tex="x^2"]'),
  ).toBeVisible()
})

test("slash-command: footnote action inserts a native reference and definition", async ({
  page,
}) => {
  const { editor } = await openPublicTypeaheadEditor(page)

  await chooseSlashCommand(page, editor, "/footnote", "Footnote")
  await expect(
    editor.locator('[data-editor-footnote-reference="1"]'),
  ).toHaveCount(1)
  await expect(
    editor.locator('[data-editor-footnote-definition="1"]'),
  ).toHaveCount(1)
})
