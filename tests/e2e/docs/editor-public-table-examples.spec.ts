import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function example(page: Page, slug: string) {
  return page.getByTestId(`editor-example-${slug}`)
}

async function surface(page: Page, slug: string, name: string) {
  const root = example(page, slug)
  const toggle = root.getByRole("button", { name: "Live preview", exact: true })

  if ((await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click()
  const editor = root.getByRole("textbox", { name, exact: true })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  return editor
}

function toolbar(page: Page, slug: string, name: string) {
  return example(page, slug).getByRole("toolbar", { name, exact: true })
}

async function tableAction(page: Page, slug: string, name: string) {
  await toolbar(page, slug, "Public table formatting")
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await page.getByRole("menuitem", { name, exact: true }).click()
  await expect(page.getByRole("menu")).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-tables")
})

test("table: edits, resizes, changes headers and presentation, merges and splits", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const editor = await surface(page, "public-tables", "Public table editor")
  const root = example(page, "public-tables")
  const tableEditor = root.getByTestId("public-table-editor")
  const controls = toolbar(page, "public-tables", "Public table formatting")
  await editor.fill("Table notes")
  await controls
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = editor.getByRole("table")
  await expect(table.getByRole("row")).toHaveCount(3)
  const first = table.locator("th, td").first()
  const second = table.locator("th, td").nth(4)
  await first.click()
  await page.keyboard.insertText("North")
  await second.click()
  await page.keyboard.insertText("South")

  await first.scrollIntoViewIfNeeded()
  const start = await first.boundingBox()
  const end = await second.boundingBox()

  if (!start || !end) throw new Error("Table cells must have visible bounds")
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 10,
  })
  await page.mouse.up()
  await tableAction(page, "public-tables", "Merge selected cells")
  const merged = table.locator('[colspan="2"][rowspan="2"]')
  await expect(merged).toHaveCount(1)
  await expect(merged).toContainText("North")
  await expect(merged).toContainText("South")
  const mergedHTML = await table.evaluate((element) => element.outerHTML)
  await merged.click()
  await tableAction(page, "public-tables", "Split merged cell")
  await expect(table.locator("th, td")).toHaveCount(9)
  await expect(table).toContainText("North")
  await expect(table).toContainText("South")

  const headerTarget = table.getByRole("row").nth(1).getByRole("cell").first()
  await headerTarget.click()
  await tableAction(page, "public-tables", "Toggle header row")
  await expect(
    table.getByRole("row").nth(1).getByRole("columnheader"),
  ).toHaveCount(3)
  const styledCell = table.locator("th, td").first()
  await styledCell.click()
  await tableEditor
    .getByRole("textbox", { name: "Cell background", exact: true })
    .fill("#ffcc00")
  await tableEditor
    .getByRole("button", { name: "Apply cell background", exact: true })
    .click()
  await expect(styledCell).toHaveCSS("background-color", "rgb(255, 204, 0)")

  const column = tableEditor.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  await column.focus()
  const width = Number(await column.getAttribute("aria-valuenow"))
  await column.press("ArrowRight")
  await expect(column).toHaveAttribute("aria-valuenow", String(width + 10))

  const row = tableEditor.getByRole("separator", {
    name: "Row 1 minimum height",
    exact: true,
  })

  await row.press("Home")
  await row.press("ArrowDown")
  await expect(row).toHaveAttribute("aria-valuenow", "10")

  await editor.fill("")
  await page.evaluate(async (html) => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ])
  }, mergedHTML)
  await editor.click()
  await editor.press("ControlOrMeta+v")
  const roundtrip = editor.getByRole("table")
  const roundtripSpan = roundtrip.locator('[colspan="2"][rowspan="2"]')
  await expect(roundtripSpan).toHaveCount(1)
  await expect(roundtripSpan).toContainText("North")
  await expect(roundtripSpan).toContainText("South")

  await testInfo.attach("table.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
  const headers = editor.locator("th")

  for (const [index, header] of (await headers.all()).entries()) {
    if (!(await header.innerText()).trim()) {
      await header.click()
      await page.keyboard.insertText(`Header ${index + 1}`)
    }
  }

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-tables"]')
    .analyze()

  expect(report.violations).toEqual([])
})

test("table-nomerge: disables new merges and preserves imported spans", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const root = example(page, "public-tables")
  const editor = await surface(page, "public-tables", "No-merge table editor")
  const noMergeEditor = root.getByTestId("public-table-nomerge-editor")

  const noMergeToolbar = noMergeEditor.getByRole("toolbar", {
    name: "No-merge table formatting",
    exact: true,
  })

  await expect(
    noMergeToolbar.getByRole("button", { name: "Table actions", exact: true }),
  ).toHaveCount(1)
  await noMergeEditor
    .getByRole("spinbutton", { name: "Table rows", exact: true })
    .fill("2")
  await noMergeEditor
    .getByRole("spinbutton", { name: "Table columns", exact: true })
    .fill("2")
  await noMergeEditor
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const inserted = editor.getByRole("table")
  await expect(inserted.getByRole("row")).toHaveCount(2)
  const first = inserted.locator("td, th").first()
  await first.click()
  await page.keyboard.insertText("Editable cell")
  await noMergeEditor
    .getByRole("textbox", { name: "Cell background", exact: true })
    .fill("#dbeafe")
  await noMergeEditor
    .getByRole("button", { name: "Apply cell background", exact: true })
    .click()

  await first.click()
  await noMergeToolbar
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await page
    .getByRole("menuitem", { name: "Insert row below", exact: true })
    .click()
  await expect(inserted.getByRole("row")).toHaveCount(3)
  await first.click()
  await noMergeToolbar
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await page
    .getByRole("menuitem", { name: "Toggle header row", exact: true })
    .click()
  await expect(
    inserted.getByRole("row").first().getByRole("columnheader"),
  ).toHaveCount(2)

  const resize = noMergeEditor.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  await resize.focus()
  const initialWidth = Number(await resize.getAttribute("aria-valuenow"))
  await resize.press("ArrowRight")
  await expect(resize).toHaveAttribute(
    "aria-valuenow",
    String(initialWidth + 10),
  )

  const rowResize = noMergeEditor.getByRole("separator", {
    name: "Row 1 minimum height",
    exact: true,
  })

  await rowResize.focus()
  await rowResize.press("Home")
  await rowResize.press("ArrowDown")
  await expect(rowResize).toHaveAttribute("aria-valuenow", "10")

  const mergeStart = inserted.locator("td, th").first()
  const mergeEnd = inserted.locator("td, th").nth(1)
  await mergeStart.scrollIntoViewIfNeeded()
  const start = await mergeStart.boundingBox()
  const end = await mergeEnd.boundingBox()

  if (!start || !end) throw new Error("Table cells must have visible bounds")
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 10,
  })
  await page.mouse.up()
  await noMergeToolbar
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await expect(
    page.getByRole("menuitem", { name: "Merge selected cells", exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole("menuitem", { name: "Insert row below", exact: true }),
  ).toBeEnabled()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toHaveCount(0)
  await expect(inserted.locator('[colspan="2"], [rowspan="2"]')).toHaveCount(0)

  await editor.fill("")
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            [
              '<table><tbody><tr><td colspan="2">Existing span</td></tr>',
              "<tr><td>Left</td><td>Right</td></tr></tbody></table>",
            ].join(""),
          ],
          { type: "text/html" },
        ),
      }),
    ])
  })
  await editor.click()
  await editor.press("ControlOrMeta+v")
  const table = editor.getByRole("table")
  const span = table.locator('td[colspan="2"]')
  await expect(span).toHaveText("Existing span")
  await span.click()
  await page.keyboard.insertText(" updated")
  await noMergeEditor
    .getByRole("textbox", { name: "Cell background", exact: true })
    .fill("#dbeafe")
  await noMergeEditor
    .getByRole("button", { name: "Apply cell background", exact: true })
    .click()
  await expect(span).toContainText("updated")
  await expect(span).toHaveCSS("background-color", "rgb(219, 234, 254)")
  await noMergeToolbar
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await expect(
    page.getByRole("menuitem", { name: "Merge selected cells", exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole("menuitem", { name: "Split merged cell", exact: true }),
  ).toBeEnabled()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toHaveCount(0)
  await expect(span).toHaveAttribute("colspan", "2")
  await expect(table.locator('td[colspan="2"]')).toHaveCount(1)
  await testInfo.attach("table-nomerge.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("table: trusted local JSON and HTML snapshots retain native cell content, marks, geometry, and presentation", async ({
  page,
}, testInfo) => {
  const editor = await surface(page, "public-tables", "Public table editor")
  const root = example(page, "public-tables").getByTestId("public-table-editor")
  await root.getByRole("button", { name: "Insert table", exact: true }).click()
  const table = editor.getByRole("table")
  const first = table.locator("th, td").first()
  await first.click()
  await page.keyboard.press("ControlOrMeta+b")
  await page.keyboard.insertText("Snapshot")
  await page.keyboard.press("ControlOrMeta+b")
  await root
    .getByRole("textbox", { name: "Cell background", exact: true })
    .fill("#ffcc00")
  await root
    .getByRole("button", { name: "Apply cell background", exact: true })
    .click()

  const row = root.getByRole("separator", {
    name: "Row 1 minimum height",
    exact: true,
  })

  await row.press("Home")
  await row.press("ArrowDown")

  for (const format of ["JSON", "HTML"] as const) {
    await root
      .getByRole("button", { name: `Save table ${format}`, exact: true })
      .click()
    await first.locator("p").fill("Changed")
    await root
      .getByRole("button", { name: `Load table ${format}`, exact: true })
      .click()
    await expect(first.locator("strong, b")).toHaveText("Snapshot")
    await expect(first).toHaveCSS("background-color", "rgb(255, 204, 0)")
    await expect(table.getByRole("row")).toHaveCount(3)
    await expect
      .poll(() =>
        table
          .getByRole("row")
          .first()
          .evaluate((element) => element.style.height),
      )
      .toBe("10px")
    await expect(root.getByRole("alert")).toHaveCount(0)
  }

  await testInfo.attach("public-table-snapshot-roundtrip.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
