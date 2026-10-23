import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function primaryEditor(page: Page) {
  return page.getByRole("textbox", { name: "Rich text editor", exact: true })
}

function primaryToolbar(page: Page) {
  return page.getByRole("toolbar", {
    name: "Rich text editor formatting",
    exact: true,
  })
}

async function insertTable(page: Page) {
  await primaryEditor(page).fill("Table notes")
  await primaryToolbar(page)
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = primaryEditor(page).getByRole("table")
  await expect(table.getByRole("row")).toHaveCount(3)
  await table.getByRole("row").first().getByRole("columnheader").first().click()

  return table
}

async function tableAction(page: Page, name: string) {
  await primaryToolbar(page)
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await page.getByRole("menuitem", { name, exact: true }).click()
  await expect(page.getByRole("menu")).toHaveCount(0)
  await expect(primaryEditor(page)).toBeFocused()
}

async function writeCell(page: Page, cell: Locator, text: string) {
  await cell.click()
  await page.keyboard.insertText(text)
}

test.beforeEach(async ({ page }) => {
  await page.goto("/docs/editor")
  await expect(primaryEditor(page)).toHaveAttribute("contenteditable", "true")
})

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach("editor-tables.html", {
    body: await primaryEditor(page).innerHTML(),
    contentType: "text/html",
  })
})

test("table actions outside tables are disabled and keyboard dismissible", async ({
  page,
}) => {
  await primaryEditor(page).fill("Outside table")

  const trigger = primaryToolbar(page).getByRole("button", {
    name: "Table actions",
    exact: true,
  })

  await trigger.focus()
  await trigger.press("ArrowDown")
  const menu = page.getByRole("menu", { name: "Table actions", exact: true })
  await expect(menu).toBeVisible()

  for (const item of await menu.getByRole("menuitem").all()) {
    await expect(item).toBeDisabled()
  }

  await page.keyboard.press("Escape")
  await expect(menu).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(primaryEditor(page)).toHaveText("Outside table")
})

test("inserts and deletes rows and columns without changing other cell content", async ({
  page,
}) => {
  const table = await insertTable(page)
  await writeCell(page, table.locator("th, td").first(), "Keep this")

  for (const name of ["Insert row above", "Insert row below"]) {
    await table.locator("th, td").first().click()
    await tableAction(page, name)
  }

  await expect(table.getByRole("row")).toHaveCount(5)

  for (const name of ["Insert column before", "Insert column after"]) {
    await table.locator("th, td").first().click()
    await tableAction(page, name)
  }

  await expect(table.getByRole("row").first().locator("th, td")).toHaveCount(5)
  await table.locator("th, td").first().click()
  await tableAction(page, "Delete row")
  await expect(table.getByRole("row")).toHaveCount(4)
  await table.locator("th, td").first().click()
  await tableAction(page, "Delete column")
  await expect(table.getByRole("row").first().locator("th, td")).toHaveCount(4)
  await expect(table).toContainText("Keep this")
  await table.locator("th, td").first().click()
  await tableAction(page, "Delete table")
  await expect(primaryEditor(page).getByRole("table")).toHaveCount(0)
  await primaryToolbar(page)
    .getByRole("button", { name: "Undo", exact: true })
    .click()
  await expect(table).toContainText("Keep this")
  await primaryToolbar(page)
    .getByRole("button", { name: "Redo", exact: true })
    .click()
  await expect(table).toHaveCount(0)
})

test("toggles header row and individual header cell with keyboard commands", async ({
  page,
}) => {
  const table = await insertTable(page)
  const row = table.getByRole("row").nth(1)
  await row.getByRole("cell").first().click()

  const trigger = primaryToolbar(page).getByRole("button", {
    name: "Table actions",
    exact: true,
  })

  await trigger.focus()
  await trigger.press("ArrowDown")

  const toggle = page.getByRole("menuitem", {
    name: "Toggle header row",
    exact: true,
  })

  await toggle.focus()
  await toggle.press("Enter")
  await expect(row.getByRole("columnheader")).toHaveCount(3)
  await row.getByRole("columnheader").nth(1).click()
  await tableAction(page, "Toggle header row")
  await expect(row.getByRole("cell")).toHaveCount(2)
  await row.getByRole("cell").first().click()
  await tableAction(page, "Toggle header cell")
  await expect(row.getByRole("columnheader")).toHaveCount(1)
  await expect(row.getByRole("rowheader")).toHaveCount(1)
  await row.getByRole("columnheader").first().click()
  await tableAction(page, "Toggle header cell")
  await expect(row.getByRole("cell")).toHaveCount(2)
})

test("merges rectangular selection, preserves content, splits and restores history", async ({
  page,
}) => {
  const table = await insertTable(page)
  const first = table.getByRole("row").first().locator("th, td").first()
  const last = table.getByRole("row").nth(1).locator("th, td").nth(1)
  await writeCell(page, first, "North")
  await writeCell(page, last, "South")
  await first.click()
  await primaryToolbar(page)
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await expect(
    page.getByRole("menuitem", { name: "Merge selected cells", exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole("menuitem", { name: "Split merged cell", exact: true }),
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  const start = await first.boundingBox()
  const end = await last.boundingBox()

  if (!start || !end) throw new Error("Table cells must have visible bounds")
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 10,
  })
  await page.mouse.up()
  await tableAction(page, "Merge selected cells")
  const merged = table.locator('[colspan="2"][rowspan="2"]')
  await expect(merged).toHaveCount(1)
  await expect(merged).toContainText("North")
  await expect(merged).toContainText("South")
  await expect(table.locator("th, td")).toHaveCount(6)
  await merged.click()
  await tableAction(page, "Split merged cell")
  await expect(table.locator("th, td")).toHaveCount(9)
  await expect(table).toContainText("North")
  await expect(table).toContainText("South")
  await primaryToolbar(page)
    .getByRole("button", { name: "Undo", exact: true })
    .click()
  await expect(merged).toHaveCount(1)
  await primaryToolbar(page)
    .getByRole("button", { name: "Redo", exact: true })
    .click()
  await expect(table.locator("th, td")).toHaveCount(9)
})

test("@a11y table and open action menu stay accessible; readonly cannot mutate", async ({
  page,
}, testInfo) => {
  const table = await insertTable(page)

  for (const [index, cell] of (await table.locator("th, td").all()).entries()) {
    await writeCell(page, cell, `Entry ${index + 1}`)
  }

  const rendered = await new AxeBuilder({ page }).analyze()
  await primaryToolbar(page)
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await expect(
    page.getByRole("menu", { name: "Table actions", exact: true }),
  ).toBeVisible()
  const menu = await new AxeBuilder({ page }).analyze()
  await page.keyboard.press("Escape")
  await table.getByRole("row").nth(1).getByRole("cell").first().click()
  await tableAction(page, "Toggle header row")
  const headers = await new AxeBuilder({ page }).analyze()

  const readonly = page.getByRole("textbox", {
    name: "Read-only editor",
    exact: true,
  })

  const before = await readonly.innerHTML()
  await expect(
    page
      .getByRole("toolbar", {
        name: "Read-only editor formatting",
        exact: true,
      })
      .getByRole("button", { name: "Table actions", exact: true }),
  ).toBeDisabled()
  await readonly.click()
  await page.keyboard.type("Must not change")
  expect(await readonly.innerHTML()).toBe(before)
  await testInfo.attach("editor-tables-axe.json", {
    body: JSON.stringify({ rendered, menu, headers }, null, 2),
    contentType: "application/json",
  })
  expect(rendered.violations).toEqual([])
  expect(menu.violations).toEqual([])
  expect(headers.violations).toEqual([])
})
