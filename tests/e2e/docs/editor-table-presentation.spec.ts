import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

test.use({ trace: "on" })

function editor(page: Page) {
  return page.getByRole("textbox", { name: "Table editor", exact: true })
}

function toolbar(page: Page) {
  return page.getByRole("toolbar", { name: "Table formatting", exact: true })
}

async function insert(page: Page, rows = 3, columns = 3) {
  await expect(editor(page)).toHaveAttribute("contenteditable", "true")
  await editor(page).fill("Tables")
  await page
    .getByRole("spinbutton", { name: "Table rows", exact: true })
    .fill(String(rows))
  await page
    .getByRole("spinbutton", { name: "Table columns", exact: true })
    .fill(String(columns))
  await toolbar(page)
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = editor(page).getByRole("table")
  await table.locator("th, td").first().click()

  return table
}

async function action(page: Page, name: string) {
  await toolbar(page)
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await page.getByRole("menuitem", { name, exact: true }).click()
}

async function drag(
  page: Page,
  target: ReturnType<Page["getByRole"]>,
  distance: number,
) {
  const box = await target.boundingBox()

  if (!box) throw new Error("Resize separator must be visible")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    box.x + box.width / 2 + distance,
    box.y + box.height / 2,
    { steps: 12 },
  )
  await page.mouse.up()
}

test.beforeEach(async ({ page }) => {
  await page.goto("/docs/editor")
  await expect(editor(page)).toHaveAttribute("contenteditable", "true")
})

test.afterEach(async ({ page }, info) => {
  await info.attach("table-presentation.html", {
    body: await editor(page).innerHTML(),
    contentType: "text/html",
  })
  await info.attach("table-presentation.png", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})

test("rejected row insertion keeps content and reports an error without a page crash", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  const table = await insert(page, 50, 1)
  const cell = table.locator("th, td").first()
  await cell.click()
  await page.keyboard.press("ControlOrMeta+b")
  await page.keyboard.insertText("Keep table content")
  await action(page, "Insert row below")
  await expect(table.getByRole("row")).toHaveCount(50)
  await expect(cell.locator("strong")).toHaveText("Keep table content")
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(editor(page)).toHaveAttribute("contenteditable", "true")
  expect(errors).toEqual([])
})

test("cell presentation rejects host replacement while its input has focus", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await insert(page)

  const background = page.getByRole("textbox", {
    name: "Cell background",
    exact: true,
  })

  await background.click()
  await expect(
    page.getByRole("button", { name: "Apply cell background", exact: true }),
  ).toBeEnabled()
  await background.press("Alt+Shift+N")
  await expect(editor(page)).toHaveText("Replacement content")

  for (const name of [
    "Apply cell background",
    "Reset cell background",
    "Show cell borders",
    "Hide cell borders",
    "Reset cell borders",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toBeDisabled()
  await background.press("Enter")
  await expect(editor(page).getByRole("table")).toHaveCount(0)
  await expect(editor(page)).toHaveText("Replacement content")
  expect(errors).toEqual([])
})

test("table menu rejects host replacement while its popup stays open", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await insert(page)
  await toolbar(page)
    .getByRole("button", { name: "Table actions", exact: true })
    .click()

  const insertRow = page.getByRole("menuitem", {
    name: "Insert row below",
    exact: true,
  })

  await insertRow.press("Alt+Shift+N")
  await expect(editor(page)).toHaveText("Replacement content")
  await expect(insertRow).toBeDisabled()
  await page.keyboard.press("Enter")
  await expect(editor(page).getByRole("table")).toHaveCount(0)
  expect(errors).toEqual([])
})

test("dimensions, explicit widths, bounded pointer and keyboard resize, history", async ({
  page,
}) => {
  const table = await insert(page, 2, 4)
  await expect(table.getByRole("row")).toHaveCount(2)
  await expect(table.getByRole("row").first().locator("th, td")).toHaveCount(4)

  const separator = page.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  const initialWidth = Number(await separator.getAttribute("aria-valuenow"))
  await drag(page, separator, 20)
  await expect(separator).toHaveAttribute(
    "aria-valuenow",
    String(Math.min(640, initialWidth + 20)),
  )
  await separator.focus()
  await separator.press("Home")
  await expect(separator).toHaveAttribute("aria-valuenow", "48")
  await separator.press("ArrowRight")
  await expect(separator).toHaveAttribute("aria-valuenow", "58")
  await drag(page, separator, 80)
  await expect(separator).toHaveAttribute("aria-valuenow", "138")
  await expect(table.locator("col").first()).toHaveCSS("width", "138px")
  await toolbar(page).getByRole("button", { name: "Undo", exact: true }).click()
  await expect(separator).toHaveAttribute("aria-valuenow", "58")
  await toolbar(page).getByRole("button", { name: "Redo", exact: true }).click()
  await expect(separator).toHaveAttribute("aria-valuenow", "138")
  await drag(page, separator, 2000)
  await expect(separator).toHaveAttribute("aria-valuenow", "640")
  await separator.press("Home")
  await separator.press("ArrowLeft")
  await expect(separator).toHaveAttribute("aria-valuenow", "48")
})

test("readonly cancels active drag, Escape restores widths, RTL reverses direction", async ({
  page,
}) => {
  await insert(page)

  const separator = page.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  await separator.press("Home")
  const box = await separator.boundingBox()

  if (!box) throw new Error("Resize separator must be visible")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y)
  await page.keyboard.press("Escape")
  await page.mouse.up()
  await expect(separator).toHaveAttribute("aria-valuenow", "48")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y)
  await page.keyboard.press("Alt+Shift+R")
  await page.mouse.up()
  await expect(separator).toHaveAttribute("aria-disabled", "true")
  await expect(separator).toHaveAttribute("aria-valuenow", "48")
  await separator.press("End")
  await expect(separator).toHaveAttribute("aria-valuenow", "48")
  await page
    .getByRole("button", { name: "Enable table editing", exact: true })
    .click()
  await page.getByRole("button", { name: "Use RTL", exact: true }).click()
  await separator.press("ArrowLeft")
  await expect(separator).toHaveAttribute("aria-valuenow", "58")
  await drag(page, separator, -60)
  await expect(separator).toHaveAttribute("aria-valuenow", "118")
})

test("native multi-cell selection, presentation and merged spans survive JSON and HTML", async ({
  page,
}) => {
  const table = await insert(page)
  const cells = table.locator("th, td")
  await cells.first().click()
  await page.keyboard.insertText("North")
  const start = await cells.first().boundingBox()
  const end = await cells.nth(4).boundingBox()

  if (!start || !end) throw new Error("Cells must be visible")
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 12,
  })
  await page.mouse.up()
  await page
    .getByRole("textbox", { name: "Cell background", exact: true })
    .fill("#ffcc00")
  await page
    .getByRole("button", { name: "Apply cell background", exact: true })
    .click()

  for (const index of [0, 1, 3, 4])
    await expect(cells.nth(index)).toHaveCSS(
      "background-color",
      "rgb(255, 204, 0)",
    )
  await page
    .getByRole("button", { name: "Hide cell borders", exact: true })
    .click()
  await action(page, "Merge selected cells")
  const merged = table.locator('[colspan="2"][rowspan="2"]')
  await expect(merged).toContainText("North")
  await merged.click()
  await page
    .getByRole("button", { name: "Show cell borders", exact: true })
    .click()
  await expect(merged).toHaveAttribute("data-editor-border", "solid")
  await expect(merged).not.toHaveCSS("box-shadow", "none")

  for (const name of ["Reload table JSON", "Reload table HTML"]) {
    await page.getByRole("button", { name, exact: true }).click()
    await expect(merged).toHaveCSS("background-color", "rgb(255, 204, 0)")
    await expect(merged).toHaveAttribute("data-editor-border", "solid")
    await expect(merged).toContainText("North")
  }

  await merged.click()
  await action(page, "Split merged cell")
  await expect(table.locator('[colspan="2"]')).toHaveCount(0)
})

test("real clipboard TSV and HTML table paste retain content and spans", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await editor(page).fill("")
  await page.evaluate(() => navigator.clipboard.writeText("A\tB\nC\tD"))
  await editor(page).click()
  await page.keyboard.press("ControlOrMeta+V")
  await expect(editor(page).getByRole("table")).toContainText("D")
  await expect(editor(page).getByRole("table").getByRole("row")).toHaveCount(2)
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            '<table><tr><td colspan="2" style="background-color:#ffcc00" data-editor-border="solid">Pasted</td></tr><tr><td>X</td><td>Y</td></tr></table>',
          ],
          { type: "text/html" },
        ),
      }),
    ])
  })
  await editor(page).press("ControlOrMeta+End")
  await editor(page).press("ArrowDown")
  await editor(page).press("Enter")
  await page.keyboard.press("ControlOrMeta+V")
  await expect(editor(page).locator('td[colspan="2"]')).toContainText("Pasted")
  await expect(editor(page).locator('td[colspan="2"]')).toHaveCSS(
    "background-color",
    "rgb(255, 204, 0)",
  )
})

test("widths survive JSON/HTML, mobile contains overflow, initial and interactive axe @a11y", async ({
  page,
}, info) => {
  const initial = await new AxeBuilder({ page })
    .include('[data-testid="table-example"]')
    .analyze()

  const table = await insert(page, 3, 8)

  for (const [index, header] of (await table.locator("th").all()).entries()) {
    await header.click()
    await page.keyboard.insertText(`Header ${index + 1}`)
  }

  const separator = page.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  await separator.press("End")

  for (const name of ["Reload table JSON", "Reload table HTML"]) {
    await page.getByRole("button", { name, exact: true }).click()
    await editor(page).locator("th, td").first().click()
    await expect(separator).toHaveAttribute("aria-valuenow", "640")
  }

  const interactive = await new AxeBuilder({ page })
    .include('[data-testid="table-example"]')
    .analyze()

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await info.attach(`table-controls-${width}.png`, {
      body: await page
        .getByTestId("table-example")
        .screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  await info.attach("table-axe.json", {
    body: JSON.stringify({ initial, interactive }),
    contentType: "application/json",
  })
  expect(initial.violations).toEqual([])
  expect(interactive.violations).toEqual([])
})

test("rejects invalid dimensions, colors and unsafe JSON without changing document", async ({
  page,
}) => {
  await editor(page).fill("Keep document")
  const rows = page.getByRole("spinbutton", { name: "Table rows", exact: true })

  const columns = page.getByRole("spinbutton", {
    name: "Table columns",
    exact: true,
  })

  const insertButton = toolbar(page).getByRole("button", {
    name: "Insert table",
    exact: true,
  })

  for (const value of ["0", "51", "1.5", ""]) {
    await rows.fill(value)
    await expect(insertButton).toBeDisabled()
  }

  await rows.fill("50")
  await columns.fill("51")
  await expect(insertButton).toBeDisabled()
  await rows.fill("3")
  await columns.fill("3")
  await insertButton.click()
  await editor(page).locator("th, td").first().click()
  await page
    .getByRole("textbox", { name: "Cell background", exact: true })
    .fill("url(https://invalid.test/color)")
  await expect(
    page.getByRole("button", { name: "Apply cell background", exact: true }),
  ).toBeDisabled()
  const output = page.getByLabel("Serialized table state", { exact: true })
  const serialized = await output.textContent()

  if (!serialized) throw new Error("Serialized table state must exist")
  const before: unknown = JSON.parse(serialized)

  for (const update of [
    { colWidths: [0, 120, 120] },
    { colWidths: [641, 120, 120] },
    { colWidths: Array.from({ length: 51 }, () => 120) },
  ]) {
    const state = z
      .looseObject({
        root: z.looseObject({
          children: z.array(z.record(z.string(), z.unknown())),
        }),
      })
      .parse(JSON.parse(serialized))

    const table = state.root.children.find((node) => node.type === "table")

    if (!table) throw new Error("Serialized table must exist")
    Object.assign(table, update)
    await page
      .getByRole("textbox", { name: "Table JSON input", exact: true })
      .fill(JSON.stringify(state))
    await page
      .getByRole("button", { name: "Import table JSON", exact: true })
      .click()
    await expect(page.getByRole("alert")).toBeVisible()
    expect(JSON.parse((await output.textContent()) ?? "null")).toEqual(before)
  }
})

test("rejected external HTML preserves formatted table and geometry", async ({
  page,
}) => {
  const table = await insert(page, 2, 2)
  await table.locator("th, td").first().click()
  await page.keyboard.press("ControlOrMeta+B")
  await page.keyboard.insertText("Keep rich content")
  await page.keyboard.press("ControlOrMeta+B")
  const output = page.getByLabel("Serialized table state", { exact: true })
  const before = await output.textContent()

  for (const html of [
    '<table><tr><td rowspan="3">Bad</td></tr></table>',
    "<table><tr><td>A</td><td>B</td></tr><tr><td>C</td></tr></table>",
    "<table><tr><td><table><tr><td>Nested</td></tr></table></td></tr></table>",
  ]) {
    await page
      .getByRole("textbox", { name: "Table HTML input", exact: true })
      .fill(html)
    await page
      .getByRole("button", { name: "Import table HTML", exact: true })
      .click()
    await expect(page.getByRole("alert")).toBeVisible()
    await expect(output).toHaveText(before ?? "")
    await expect(table.locator("strong, b")).toContainText("Keep rich content")
  }
})

test("focus loss and document changes cancel pointer preview without stale writes", async ({
  page,
}) => {
  const table = await insert(page, 2, 2)

  const separator = page.getByRole("separator", {
    name: "Column 1 width",
    exact: true,
  })

  await separator.press("Home")
  const box = await separator.boundingBox()

  if (!box) throw new Error("Resize separator must be visible")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y)
  await page.keyboard.press("Tab")
  await page.mouse.up()
  await expect(separator).toHaveAttribute("aria-valuenow", "48")
  await separator.focus()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, box.y)
  await page.keyboard.press("End")
  await page.mouse.up()
  await expect(separator).toHaveAttribute("aria-valuenow", "640")
  await expect(table.locator("col").first()).toHaveCSS("width", "640px")
})
