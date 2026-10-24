import type { Locator, Page, TestInfo } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function openPart(page: Page, slug: string, name: string) {
  await page.goto(`/editor/${slug}`)

  const preview = page.getByRole("group", {
    name: `${name} live preview`,
    exact: true,
  })

  const editor = preview.getByRole("textbox", {
    name: `${name} preview`,
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { preview, editor }
}

async function scan(page: Page, info: TestInfo, state: string) {
  const report = await new AxeBuilder({ page }).analyze()
  await info.attach(`${state}-axe.json`, {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
}

async function completeTable(page: Page, editor: Locator) {
  const table = editor.getByRole("table")
  await expect(table).toBeVisible()
  const cells = table.locator("th, td")

  for (const [index, cell] of (await cells.all()).entries()) {
    const text = `Cell ${index + 1}`
    await cell.click()
    await page.keyboard.insertText(text)
    await expect(cell).toHaveText(text)
  }

  await cells.first().click()

  return table
}

test.afterEach(async ({ page }, info) => {
  const preview = page.locator('[data-slot="editor-part-preview"]')
  await info.attach("preview-state.json", {
    body: JSON.stringify(
      await preview.evaluate((element) => ({
        html: element.innerHTML,
        text: element.textContent,
        selection: window.getSelection()?.toString(),
      })),
      null,
      2,
    ),
    contentType: "application/json",
  })
  await info.attach("preview.png", {
    body: await preview.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  const viewport = page.viewportSize()

  if (!viewport) throw new Error("Expected a configured browser viewport")
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(viewport.width)
})

test("history preview undoes and natively redoes an edit @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "history-button",
    "EditorHistoryButton",
  )

  const undo = preview.getByRole("button", { name: "Undo", exact: true })
  await expect(undo).toBeDisabled()
  await editor.fill("History entry")
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(editor).toHaveText("")
  await expect(undo).toBeDisabled()
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor).toHaveText("History entry")
  await expect(undo).toBeEnabled()
  await scan(page, info, "history-restored")
})

test("block preview converts selected native paragraphs @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "block-button",
    "EditorBlockButton",
  )

  await editor.fill("First block")
  await editor.press("Enter")
  await editor.pressSequentially("Second block")
  await editor.press("ControlOrMeta+a")
  await preview.getByRole("button", { name: "Heading 2", exact: true }).click()
  await expect(editor.locator("h2")).toHaveText(["First block", "Second block"])
  await expect(editor.locator("p")).toHaveCount(0)
  await editor.press("ArrowRight")
  await editor.press("End")
  await editor.pressSequentially(" edited")
  await expect(editor.locator("h2").last()).toHaveText("Second block edited")
  await scan(page, info, "headings-edited")
})

test("list preview creates and continues native list items @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "list-button",
    "EditorListButton",
  )

  await editor.fill("First item")
  await editor.press("ControlOrMeta+a")
  await preview
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await expect(editor.locator("ul > li")).toHaveText(["First item"])
  await editor.press("ArrowRight")
  await editor.press("End")
  await editor.press("Enter")
  await editor.pressSequentially("Second item")
  await expect(editor.locator("ul > li")).toHaveText([
    "First item",
    "Second item",
  ])
  await editor.press("Enter")
  await editor.press("Enter")
  await editor.pressSequentially("After list")
  await expect(editor.locator("p").last()).toHaveText("After list")
  await scan(page, info, "list-and-paragraph")
})

test("indent preview changes selected block and native undo reverses it @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "indent-button",
    "EditorIndentButton",
  )

  await editor.fill("Indented block")
  const paragraph = editor.locator("p")

  const before = await paragraph.evaluate(
    (element) => getComputedStyle(element).paddingInlineStart,
  )

  await preview.getByRole("button", { name: "Indent", exact: true }).click()
  await expect(paragraph).not.toHaveCSS("padding-inline-start", before)
  await editor.press("ControlOrMeta+z")
  await expect(paragraph).toHaveCSS("padding-inline-start", before)
  await expect(paragraph).toHaveText("Indented block")
  await scan(page, info, "indent-undone")
})

test("alignment preview aligns only selected block @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "alignment-button",
    "EditorAlignmentButton",
  )

  await editor.fill("Unchanged block")
  await editor.press("Enter")
  await editor.pressSequentially("Centered block")
  const first = editor.locator("p").first()

  const before = await first.evaluate(
    (element) => getComputedStyle(element).textAlign,
  )

  const center = preview.getByRole("button", {
    name: "Align center",
    exact: true,
  })

  await center.focus()
  await center.press("Enter")
  await expect(editor.locator("p").last()).toHaveCSS("text-align", "center")
  await expect(first).toHaveCSS("text-align", before)
  await scan(page, info, "aligned")
})

for (const control of [
  {
    slug: "font-color-control",
    part: "EditorFontColorControl",
    label: "Font color",
    value: "#123456",
    property: "color",
    expected: "rgb(18, 52, 86)",
    invalid: "url(https://invalid.example)",
  },
  {
    slug: "background-color-control",
    part: "EditorBackgroundColorControl",
    label: "Background color",
    value: "#ffff00",
    property: "background-color",
    expected: "rgb(255, 255, 0)",
    invalid: "url(https://invalid.example)",
  },
  {
    slug: "font-family-control",
    part: "EditorFontFamilyControl",
    label: "Font family",
    value: "Georgia",
    property: "font-family",
    expected: "Georgia",
    invalid: "Arial; color:red",
  },
  {
    slug: "font-size-control",
    part: "EditorFontSizeControl",
    label: "Font size",
    value: "24px",
    property: "font-size",
    expected: "24px",
    invalid: "Infinitypx",
  },
  {
    slug: "font-weight-control",
    part: "EditorFontWeightControl",
    label: "Font weight",
    value: "700",
    property: "font-weight",
    expected: "700",
    invalid: "1000",
  },
]) {
  test(`${control.part} applies only native selected text and rejects invalid input @a11y`, async ({
    page,
  }, info) => {
    const { preview, editor } = await openPart(page, control.slug, control.part)
    await editor.fill("Alpha Beta")
    await editor.press("Home")

    for (let index = 0; index < 5; index++)
      await editor.press("Shift+ArrowRight")

    const trigger = preview.getByRole("button", {
      name: control.label,
      exact: true,
    })

    await trigger.focus()
    await trigger.press("Enter")

    const dialog = page.getByRole("dialog", {
      name: control.label,
      exact: true,
    })

    await expect(dialog).toBeVisible()

    const input = dialog.getByRole("textbox", {
      name: `${control.label} value`,
      exact: true,
    })

    const apply = dialog.getByRole("button", {
      name: `Apply ${control.label}`,
      exact: true,
    })

    await expect(apply).toBeEnabled()
    const before = await editor.innerHTML()
    await input.fill(control.invalid)
    await apply.click()
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(editor).toHaveJSProperty("innerHTML", before)
    await scan(page, info, "invalid-dialog")
    await input.fill(control.value)
    await input.press("Enter")
    await expect(dialog).toHaveCount(0)
    await expect(editor).toBeFocused()
    await expect(editor.getByText("Alpha", { exact: true })).toHaveCSS(
      control.property,
      control.expected,
    )
    await expect(editor.getByText(" Beta", { exact: true })).not.toHaveCSS(
      control.property,
      control.expected,
    )
    await expect(editor).toHaveText("Alpha Beta")
    await scan(page, info, "applied-selection")
    await trigger.click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
}

for (const control of [
  {
    slug: "line-height-control",
    part: "EditorLineHeightControl",
    label: "Line height",
    value: "2",
    property: "lineHeight",
    invalid: "0",
  },
  {
    slug: "first-line-indent-control",
    part: "EditorFirstLineIndentControl",
    label: "First-line indent",
    value: "24px",
    property: "textIndent",
    invalid: "-1px",
  },
] as const) {
  test(`${control.part} applies block presentation across native selection @a11y`, async ({
    page,
  }, info) => {
    const { preview, editor } = await openPart(page, control.slug, control.part)
    await editor.fill("First paragraph")
    await editor.press("Enter")
    await editor.pressSequentially("Second paragraph")
    await editor.press("ControlOrMeta+a")
    await preview
      .getByRole("button", { name: control.label, exact: true })
      .click()

    const dialog = page.getByRole("dialog", {
      name: control.label,
      exact: true,
    })

    const input = dialog.getByRole("textbox", {
      name: `${control.label} value`,
      exact: true,
    })

    const before = await editor.innerHTML()
    await input.fill(control.invalid)
    await input.press("Enter")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(editor).toHaveJSProperty("innerHTML", before)
    await scan(page, info, "block-style-dialog")
    await input.fill(control.value)
    await dialog
      .getByRole("button", { name: `Apply ${control.label}`, exact: true })
      .click()
    await expect(dialog).toHaveCount(0)
    await expect(editor).toBeFocused()
    await expect(editor.locator("p")).toHaveText([
      "First paragraph",
      "Second paragraph",
    ])

    for (const paragraph of await editor.locator("p").all()) {
      await expect
        .poll(() =>
          paragraph.evaluate(
            (element, property) => element.style[property],
            control.property,
          ),
        )
        .toBe(control.value)
    }

    await scan(page, info, "block-styles-applied")
  })
}

test("clear preview removes native formatting without deleting selected content @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "clear-formatting-button",
    "EditorClearFormattingButton",
  )

  await editor.fill("Alpha Beta")
  await editor.press("Home")

  for (let index = 0; index < 5; index++) await editor.press("Shift+ArrowRight")
  await editor.press("ControlOrMeta+b")
  await editor.press("ControlOrMeta+i")
  await expect(editor.locator("strong, b")).toHaveText("Alpha")
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "italic")
  await preview
    .getByRole("button", { name: "Clear formatting", exact: true })
    .click()
  await expect(editor.locator("strong, b, em, i")).toHaveCount(0)
  await expect(editor).toHaveText("Alpha Beta")
  await expect(editor.getByText("Alpha Beta", { exact: true })).toHaveCSS(
    "font-style",
    "normal",
  )
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator("strong, b")).toHaveText("Alpha")
  await expect(editor.locator("strong, b")).toHaveCSS("font-style", "italic")
  await scan(page, info, "clear-undone")
})

test("table dimensions preview rejects invalid sizes and inserts requested grid @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "table-dimensions",
    "EditorTableDimensions",
  )

  await editor.fill("Keep introduction")

  const rows = preview.getByRole("spinbutton", {
    name: "Table rows",
    exact: true,
  })

  const columns = preview.getByRole("spinbutton", {
    name: "Table columns",
    exact: true,
  })

  const insert = preview.getByRole("button", {
    name: "Insert table",
    exact: true,
  })

  for (const value of ["0", "51", "1.5", ""]) {
    await rows.fill(value)
    await expect(insert).toBeDisabled()
    await expect(editor.getByRole("table")).toHaveCount(0)
    await expect(editor).toHaveText("Keep introduction")
  }

  await rows.fill("2")
  await columns.fill("0")
  await expect(insert).toBeDisabled()
  await columns.fill("4")
  await expect(insert).toBeEnabled()
  await insert.click()
  const table = await completeTable(page, editor)
  await expect(table.getByRole("row")).toHaveCount(2)

  for (const row of await table.getByRole("row").all())
    await expect(row.locator("th, td")).toHaveCount(4)
  await expect(editor).toContainText("Keep introduction")
  await scan(page, info, "completed-dimensions")
})

for (const control of [
  {
    slug: "table-cell-presentation",
    part: "EditorTableCellPresentation",
    background: true,
    border: true,
  },
  {
    slug: "table-background-controls",
    part: "EditorTableBackgroundControls",
    background: true,
    border: false,
  },
  {
    slug: "table-border-controls",
    part: "EditorTableBorderControls",
    background: false,
    border: true,
  },
]) {
  test(`${control.part} changes selected cells and resets presentation @a11y`, async ({
    page,
  }, info) => {
    const { preview, editor } = await openPart(page, control.slug, control.part)

    if (control.background)
      await expect(
        preview.getByRole("button", {
          name: "Apply cell background",
          exact: true,
        }),
      ).toBeDisabled()

    if (control.border)
      await expect(
        preview.getByRole("button", { name: "Show cell borders", exact: true }),
      ).toBeDisabled()
    await editor.click()
    await preview
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    const table = await completeTable(page, editor)
    const cell = table.locator("th, td").first()
    const untouched = table.locator("th, td").last()

    if (control.background) {
      const input = preview.getByRole("textbox", {
        name: "Cell background",
        exact: true,
      })

      const apply = preview.getByRole("button", {
        name: "Apply cell background",
        exact: true,
      })

      const before = await untouched.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )

      await input.fill("url(https://invalid.example)")
      await expect(apply).toBeDisabled()
      await input.fill("#ffff00")
      await apply.click()
      await expect(cell).toHaveCSS("background-color", "rgb(255, 255, 0)")
      await expect(untouched).toHaveCSS("background-color", before)
      await scan(page, info, "cell-background")
      await preview
        .getByRole("button", { name: "Reset cell background", exact: true })
        .click()
      await expect
        .poll(() => cell.evaluate((element) => element.style.backgroundColor))
        .toBe("")
    }

    if (control.border) {
      await cell.click()
      await preview
        .getByRole("combobox", { name: "Border edge style", exact: true })
        .selectOption("hidden")
      await preview
        .getByRole("button", { name: "Top cell border", exact: true })
        .click()
      await expect(cell).toHaveAttribute("data-editor-border", /"top":"hidden"/)
      await preview
        .getByRole("button", { name: "Show cell borders", exact: true })
        .click()
      await expect(cell).toHaveAttribute("data-editor-border", /"top":"solid"/)
      await preview
        .getByRole("button", { name: "Hide cell borders", exact: true })
        .click()
      await expect(cell).toHaveAttribute("data-editor-border", /"top":"hidden"/)
      await preview
        .getByRole("button", { name: "Reset cell borders", exact: true })
        .click()
      await expect(cell).not.toHaveAttribute("data-editor-border")
    }

    await expect(cell).toHaveText("Cell 1")
    await scan(page, info, "presentation-reset")
  })
}

test("table resize preview keyboard changes native geometry within bounds @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "table-resize-controls",
    "EditorTableResizeControls",
  )

  await expect(preview.getByRole("separator")).toHaveCount(0)
  await editor.click()
  await preview
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = await completeTable(page, editor)

  const column = preview.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  await expect(column).toHaveAttribute("aria-disabled", "false")
  await column.press("Home")
  const minimum = await column.getAttribute("aria-valuemin")

  if (minimum === null) throw new Error("Column minimum must exist")
  await expect(column).toHaveAttribute("aria-valuenow", minimum)
  await column.press("ArrowLeft")
  await expect(column).toHaveAttribute("aria-valuenow", minimum)
  await column.press("ArrowRight")
  const next = String(Number(minimum) + 10)
  await expect(column).toHaveAttribute("aria-valuenow", next)
  await expect(table.locator("col").first()).toHaveCSS("width", `${next}px`)
  await column.press("End")
  const maximum = await column.getAttribute("aria-valuemax")

  if (maximum === null) throw new Error("Column maximum must exist")
  await column.press("ArrowRight")
  await expect(column).toHaveAttribute("aria-valuenow", maximum)
  await expect(table.locator("col").first()).toHaveCSS("width", `${maximum}px`)

  const row = preview.getByRole("separator", {
    name: "Row 1 minimum height",
    exact: true,
  })

  await row.press("Home")
  await row.press("ArrowUp")
  await expect(table.getByRole("row").first()).toHaveAttribute(
    "data-editor-row-height",
    "0",
  )
  await row.press("ArrowDown")
  await expect(table.getByRole("row").first()).toHaveAttribute(
    "data-editor-row-height",
    "10",
  )
  await expect(row).toHaveAttribute("aria-valuetext", /10 pixels/)
  await row.press("Home")
  await expect(table.getByRole("row").first()).toHaveAttribute(
    "data-editor-row-height",
    "0",
  )
  await scan(page, info, "keyboard-resized")
})

test("table button preview inserts editable native header and body cells @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "table-button",
    "EditorTableButton",
  )

  await editor.fill("Before table")
  await preview
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = await completeTable(page, editor)
  await expect(table.getByRole("row")).toHaveCount(3)
  await expect(table.locator("th")).not.toHaveCount(0)
  await expect(table.locator("td")).not.toHaveCount(0)
  await expect(editor).toContainText("Before table")
  await scan(page, info, "table-edited")
})

test("table menu preview restores native selection for row insertion @a11y", async ({
  page,
}, info) => {
  const { preview, editor } = await openPart(
    page,
    "table-menu",
    "EditorTableMenu",
  )

  await editor.click()
  await preview
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = await completeTable(page, editor)
  await table.locator("td").last().click()

  const trigger = preview.getByRole("button", {
    name: "Table actions",
    exact: true,
  })

  await trigger.focus()
  await trigger.press("Enter")
  const menu = page.getByRole("menu", { name: "Table actions", exact: true })
  await expect(menu).toBeVisible()
  await expect(
    menu.getByRole("menuitem", { name: "Merge selected cells", exact: true }),
  ).toBeDisabled()
  await scan(page, info, "table-menu-open")
  await menu
    .getByRole("menuitem", { name: "Insert row below", exact: true })
    .click()
  await expect(menu).toHaveCount(0)
  await expect(editor).toBeFocused()
  await expect(table.getByRole("row")).toHaveCount(4)

  for (const [index, cell] of (
    await table.getByRole("row").last().locator("th, td").all()
  ).entries()) {
    await cell.click()
    await page.keyboard.insertText(`Added ${index + 1}`)
  }

  for (const header of await table.locator("th").all())
    await expect(header).not.toHaveText("")
  await expect(table.locator("th, td").first()).toHaveText("Cell 1")
  await scan(page, info, "row-inserted")
})
