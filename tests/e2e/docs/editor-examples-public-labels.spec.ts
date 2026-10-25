import AxeBuilder from "@axe-core/playwright"
import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"

const labelOptions = [
  "Editor",
  "Select Editor",
  "Block Selection",
  "Button",
  "Command",
  "Dialog",
  "Form",
  "Input",
  "Label",
  "Popover",
  "Tag Node",
]

async function openLabelsExample(page: Page) {
  await page.goto("/editor/examples#public-labels")
  const example = page.getByTestId("editor-example-public-labels")
  await expect(example).toBeVisible()
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  await expect(
    example.getByRole("textbox", { name: "Public labels editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")

  return example
}

async function expectAccessible(
  page: Page,
  example: Locator,
  testInfo: TestInfo,
  name: string,
) {
  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-labels"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach(`${name}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  await expect(example).toBeVisible()
}

test("select-editor: 1 edits selected label tokens from 11 options", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  const example = await openLabelsExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public labels editor",
    exact: true,
  })

  const options = example.getByRole("group", { name: "Label options" })

  const history = example.getByRole("toolbar", {
    name: "Public labels history",
    exact: true,
  })

  await expect(options.getByRole("checkbox")).toHaveCount(11)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expectAccessible(page, example, testInfo, "labels-editable-empty")

  await options.getByRole("checkbox", { name: "Editor", exact: true }).click()
  await example
    .getByRole("button", { name: "Apply labels", exact: true })
    .click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
  ])
  await expectAccessible(page, example, testInfo, "labels-editable-populated")

  await history.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(0)
  await history.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
  ])

  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+c")
  await history.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(0)
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
  ])

  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await editor.press("ControlOrMeta+a")
  await editor.press("ControlOrMeta+c")
  await editor.press("ControlOrMeta+End")
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(1)
  await expect(editor).toContainText("Editor")
})

test("select-editor: 2 toggles read-only and back without mutation", async ({
  page,
}, testInfo) => {
  test.slow()

  const example = await openLabelsExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public labels editor",
    exact: true,
  })

  await example.getByRole("checkbox", { name: "Editor", exact: true }).click()
  await example
    .getByRole("button", { name: "Apply labels", exact: true })
    .click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
  ])

  await example
    .getByRole("button", { name: "Make read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    example.getByRole("checkbox", { name: "Editor", exact: true }),
  ).toBeDisabled()
  await expectAccessible(page, example, testInfo, "labels-readonly-populated")
  await editor.pressSequentially("changed")
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
  ])

  await example
    .getByRole("button", { name: "Make editable", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
})

test("select-editor: 3 empty read-only state offers Add labels", async ({
  page,
}, testInfo) => {
  test.slow()

  const example = await openLabelsExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public labels editor",
    exact: true,
  })

  await example
    .getByRole("button", { name: "Make read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(0)
  await expectAccessible(page, example, testInfo, "labels-readonly-empty")

  await example.getByRole("button", { name: "Add labels", exact: true }).click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(example.getByRole("checkbox").first()).toBeEnabled()
})

test("select-editor: 4 preserves min-one and max-ten validation", async ({
  page,
}, testInfo) => {
  test.slow()

  const example = await openLabelsExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public labels editor",
    exact: true,
  })

  const apply = example.getByRole("button", {
    name: "Apply labels",
    exact: true,
  })

  const options = example.getByRole("group", { name: "Label options" })

  await apply.click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(0)
  await expectAccessible(page, example, testInfo, "labels-minimum-invalid")

  await expect(options.getByRole("checkbox")).toHaveCount(11)
  await options.getByRole("checkbox").first().focus()
  await page.keyboard.press("Space")

  for (let index = 1; index < labelOptions.length; index += 1)
    await options.getByRole("checkbox").nth(index).click()
  await apply.click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(0)
  await expectAccessible(page, example, testInfo, "labels-maximum-invalid")

  await options.getByRole("checkbox", { name: "Tag Node", exact: true }).click()
  await apply.click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveCount(10)
})

test("public-labels: remains contained across themes and viewport widths", async ({
  page,
}, testInfo) => {
  test.slow()

  const example = await openLabelsExample(page)

  for (const theme of ["light", "dark"] as const) {
    await page
      .locator("html")
      .evaluate(
        (element, value) => element.setAttribute("data-theme", value),
        theme,
      )

    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await expect
        .poll(() =>
          example.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        )
        .toBe(true)
      await expectAccessible(
        page,
        example,
        testInfo,
        `labels-${theme}-${width}px`,
      )
    }
  }
})

test("select-editor: pasted duplicates keep the first token in document order", async ({
  page,
  context,
}) => {
  test.slow()
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const example = await openLabelsExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public labels editor",
    exact: true,
  })

  await example.getByRole("checkbox", { name: "Editor", exact: true }).click()
  await example.getByRole("checkbox", { name: "Dialog", exact: true }).click()
  await example
    .getByRole("button", { name: "Apply labels", exact: true })
    .click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
    "Dialog",
  ])
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  await editor
    .locator('[data-slot="editor-label"][data-editor-label="Dialog"]')
    .evaluate((element) => {
      const selection = element.ownerDocument.getSelection()
      const range = element.ownerDocument.createRange()
      range.selectNode(element)
      selection?.removeAllRanges()
      selection?.addRange(range)
    })
  await expect
    .poll(() =>
      editor.evaluate((element) =>
        element.ownerDocument.getSelection()?.toString(),
      ),
    )
    .toBe("Dialog")
  await page.keyboard.press("ControlOrMeta+c")
  await editor.press("ControlOrMeta+Home")
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Dialog",
    "Editor",
  ])
  await example
    .getByRole("toolbar", { name: "Public labels history" })
    .getByRole("button", { name: "Undo", exact: true })
    .click()
  await expect(editor.locator('[data-slot="editor-label"]')).toHaveText([
    "Editor",
    "Dialog",
  ])
})
