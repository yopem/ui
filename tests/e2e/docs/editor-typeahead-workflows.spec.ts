import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const [label, selector] of [
  ["Paragraph", "p"],
  ["Heading 1", "h1"],
  ["Heading 6", "h6"],
  ["Quote", "blockquote"],
  ["Code block", "code"],
  ["Bullet list", "ul"],
  ["Numbered list", "ol"],
  ["Check list", "ul"],
  ["Table", "table"],
] as const) {
  test(`slash selects native ${label}`, async ({ page }, testInfo) => {
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Typeahead editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.click()
    await page.keyboard.type(`/${label}`)
    await page.getByRole("option", { name: label, exact: true }).click()
    await expect(editor.locator(selector).first()).toBeVisible()
    await expect(editor).not.toContainText(`/${label}`)
    await expect(editor).toBeFocused()

    if (label === "Check list") {
      await page.keyboard.type("Complete task")
      await expect(editor.getByRole("checkbox")).toBeVisible()
    }

    if (label === "Table") {
      const headers = editor.locator("th")
      const count = await headers.count()

      for (let index = 0; index < count; index++) {
        await headers.nth(index).click()
        await page.keyboard.type(`Column ${index + 1}`)
      }
    }

    if (label === "Check list" || label === "Table") {
      const report = await new AxeBuilder({ page })
        .include('[data-testid="typeahead-example"]')
        .analyze()

      await testInfo.attach("slash-insert-axe", {
        body: JSON.stringify(report),
        contentType: "application/json",
      })
      expect(report.violations).toEqual([])
    }
  })
}

test("slash rejects mid-block and code contexts and Escape preserves query", async ({
  page,
}) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("text /heading")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.type("/code")
  await page.keyboard.press("Enter")
  await page.keyboard.type("@Ada :smile /heading")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("Backspace")
  await page.reload()
  await editor.click()
  await page.keyboard.type("/heading")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(editor).toContainText("/heading")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toHaveCount(0)
})

test("read-only and unmount close pending typeahead; mention remains atomic", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  const example = page.getByTestId("typeahead-example")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("@Ada")
  await page.getByRole("option", { name: "Ada Lovelace" }).click()
  await page.keyboard.press("Backspace")
  await page.keyboard.press("Backspace")
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveCount(1)
  await page.keyboard.press("End")
  await page.keyboard.type(" @Gr")
  await example.getByRole("button", { name: "Read only", exact: true }).click()
  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(
    page.getByRole("listbox", { name: "Editor suggestions" }),
  ).toHaveCount(0)
  await example.getByRole("button", { name: "Hide editor" }).click()
  await expect(editor).toHaveCount(0)
  await example.getByRole("button", { name: "Show editor" }).click()

  const result = await new AxeBuilder({ page })
    .include('[data-testid="typeahead-example"]')
    .analyze()

  await testInfo.attach("readonly-remount-axe", {
    body: JSON.stringify(result),
    contentType: "application/json",
  })
  expect(result.violations).toEqual([])
})

test("emoji picker category browsing and shared frequency insert real graphemes", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  const example = page.getByTestId("typeahead-example")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type(":woman_technologist")
  await page.keyboard.press("Home")
  await page.keyboard.press("Enter")
  await example.getByRole("button", { name: "Emoji", exact: true }).click()

  const openReport = await new AxeBuilder({ page })
    .include('[aria-label="Emoji picker"]')
    .analyze()

  await testInfo.attach("emoji-picker-open-axe", {
    body: JSON.stringify(openReport),
    contentType: "application/json",
  })
  expect(openReport.violations).toEqual([])
  await page
    .getByRole("combobox", { name: "Emoji category" })
    .selectOption("frequent")
  await page
    .getByRole("option", { name: /woman technologist/ })
    .first()
    .click()
  await expect(editor).toContainText("👩‍💻👩‍💻")
  await expect(editor).toBeFocused()
  await example.getByRole("button", { name: "Emoji", exact: true }).click()
  await page
    .getByRole("combobox", { name: "Emoji category" })
    .selectOption({ label: "people body" })
  await expect(page.getByRole("button", { name: "Next emoji" })).toBeEnabled()

  const first = await page
    .getByRole("listbox", { name: "Emoji", exact: true })
    .getByRole("option")
    .first()
    .textContent()

  await page.getByRole("button", { name: "Next emoji" }).click()
  await expect(
    page
      .getByRole("listbox", { name: "Emoji", exact: true })
      .getByRole("option")
      .first(),
  ).not.toHaveText(first ?? "")
  await page.getByRole("button", { name: "Clear emoji history" }).click()
  await page
    .getByRole("combobox", { name: "Emoji category" })
    .selectOption("frequent")
  await expect(
    page
      .getByRole("listbox", { name: "Emoji", exact: true })
      .getByRole("option"),
  ).toHaveCount(0)

  const emptyReport = await new AxeBuilder({ page })
    .include('[aria-label="Emoji picker"]')
    .analyze()

  await testInfo.attach("emoji-picker-empty-axe", {
    body: JSON.stringify(emptyReport),
    contentType: "application/json",
  })
  expect(emptyReport.violations).toEqual([])
})

test("slash converts a list item to native code without an orphan list", async ({
  page,
}) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Typeahead editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.click()
  await page.keyboard.type("/bullet")
  await page.keyboard.press("Enter")
  await expect(editor.locator("ul")).toBeVisible()
  await page.keyboard.type("/code")
  await page.keyboard.press("Enter")
  await expect(editor.locator("code")).toBeVisible()
  await expect(editor.locator("ul")).toHaveCount(0)
  await expect(editor).toBeFocused()
})
