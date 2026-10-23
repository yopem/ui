import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { z } from "zod"

test.use({ trace: "on" })

function tableExample(page: Page) {
  return page.getByTestId("table-example")
}

function surface(page: Page) {
  return tableExample(page).getByRole("textbox", {
    name: "Table editor",
    exact: true,
  })
}

function rowHandle(page: Page) {
  return tableExample(page).getByRole("separator", {
    name: "Row 1 minimum height",
    exact: true,
  })
}

async function insert(page: Page) {
  await page.goto("/docs/editor")
  await expect(surface(page)).toHaveAttribute("contenteditable", "true")
  await surface(page).fill("Tables")
  await tableExample(page)
    .getByRole("toolbar", { name: "Table formatting", exact: true })
    .getByRole("button", { name: "Insert table", exact: true })
    .click()
  const table = surface(page).getByRole("table")
  await table.locator("th,td").first().click()

  return table
}

async function beginDrag(page: Page) {
  await rowHandle(page).scrollIntoViewIfNeeded()

  const box = await rowHandle(page).boundingBox()
  const row = surface(page).getByRole("row").first()
  const before = await row.boundingBox()

  if (!box || !before) throw new Error("Row separator unavailable")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 70, {
    steps: 10,
  })
  await expect
    .poll(async () => (await row.boundingBox())?.height ?? 0)
    .toBeGreaterThan(before.height)

  return before.height
}

test.afterEach(async ({ page }, info) => {
  await info.attach("table-state.html", {
    body: await surface(page).innerHTML(),
    contentType: "text/html",
  })
  await info.attach("table-edges-rows.png", {
    body: await tableExample(page).screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})

test("individual edges, shared edges, outside/inside/none/reset survive JSON and HTML", async ({
  page,
}) => {
  const table = await insert(page)
  const cell = table.locator("th,td").first()

  for (const name of [
    "No cell borders",
    "Outside cell borders",
    "Inside cell borders",
    "Top cell border",
    "Bottom cell border",
    "Start cell border",
    "End cell border",
  ]) {
    await cell.click()
    await tableExample(page).getByRole("button", { name, exact: true }).click()
    await expect(cell).toHaveAttribute("data-editor-border", /^\{/)
  }

  await cell.click()
  await tableExample(page)
    .getByRole("button", { name: "End cell border", exact: true })
    .click()
  await expect(cell).toHaveCSS("border-inline-end-style", "solid")
  await expect(table.locator("th,td").nth(1)).toHaveCSS(
    "border-inline-start-style",
    "solid",
  )

  for (const name of ["Reload table JSON", "Reload table HTML"]) {
    await tableExample(page).getByRole("button", { name, exact: true }).click()
    await expect(cell).toHaveAttribute("data-editor-border", /"end":"solid"/)
  }

  await cell.click()
  await tableExample(page)
    .getByRole("button", { name: "Reset cell borders", exact: true })
    .click()
  await expect(cell).not.toHaveAttribute("data-editor-border")
})

test("row pointer and keyboard persist minimum height with one undo entry and no clipped text", async ({
  page,
}) => {
  const table = await insert(page)
  const handle = rowHandle(page)
  await handle.press("Home")
  await handle.press("ArrowDown")
  await expect(handle).toHaveAttribute("aria-valuenow", "10")
  await beginDrag(page)
  await page.mouse.up()
  const value = await handle.getAttribute("aria-valuenow")
  expect(Number(value)).toBeGreaterThan(10)
  await expect(handle).toBeFocused()
  await tableExample(page)
    .getByRole("toolbar", { name: "Table formatting", exact: true })
    .getByRole("button", { name: "Undo", exact: true })
    .click()
  await expect(handle).toHaveAttribute("aria-valuenow", "10")
  await tableExample(page)
    .getByRole("toolbar", { name: "Table formatting", exact: true })
    .getByRole("button", { name: "Redo", exact: true })
    .click()
  await expect(handle).toHaveAttribute("aria-valuenow", value ?? "")

  for (const name of ["Reload table JSON", "Reload table HTML"]) {
    await tableExample(page).getByRole("button", { name, exact: true }).click()
    await table.locator("th,td").first().click()
    await expect(handle).toHaveAttribute("aria-valuenow", value ?? "")
  }

  await table.locator("th,td").first().click()
  await page.keyboard.insertText("Long cell content ".repeat(100))
  await handle.press("Home")
  await expect(handle).toHaveAttribute("aria-valuenow", "0")
  const bounds = await table.getByRole("row").first().boundingBox()
  expect(bounds?.height).toBeGreaterThan(10)
})

test("row preview cancels on Escape, readonly, focus loss and stale document", async ({
  page,
}) => {
  await insert(page)
  const handle = rowHandle(page)
  await handle.press("Home")

  for (const key of ["Escape", "Tab", "Alt+Shift+R"]) {
    const before = await beginDrag(page)
    await page.keyboard.press(key)
    await page.mouse.up()
    await expect(handle).toHaveAttribute("aria-valuenow", "0")
    await expect
      .poll(
        async () =>
          (await surface(page).getByRole("row").first().boundingBox())
            ?.height ?? 0,
      )
      .toBe(before)

    if (key === "Alt+Shift+R") {
      await expect(handle).toHaveAttribute("aria-disabled", "true")
      await tableExample(page)
        .getByRole("button", { name: "Enable table editing", exact: true })
        .click()
    }
  }

  await beginDrag(page)
  await page.keyboard.press("Alt+Shift+N")
  await page.mouse.up()
  await expect(surface(page).getByRole("table")).toHaveCount(0)
  await expect(handle).toHaveCount(0)
})

test("merged spans retain row geometry and edge state; overflow and axe @a11y", async ({
  page,
}, info) => {
  const table = await insert(page)
  const cells = table.locator("th,td")

  for (const [index, header] of (await table.locator("th").all()).entries()) {
    await header.click()
    await page.keyboard.insertText(`Header ${index + 1}`)
  }

  await table.scrollIntoViewIfNeeded()

  const first = await cells.first().boundingBox()
  const last = await cells.nth(4).boundingBox()

  if (!first || !last) throw new Error("Cells unavailable")
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2)
  await page.mouse.down()
  await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2, {
    steps: 12,
  })
  await page.mouse.up()
  await tableExample(page)
    .getByRole("button", { name: "Outside cell borders", exact: true })
    .click()
  await tableExample(page)
    .getByRole("button", { name: "Table actions", exact: true })
    .click()
  await page
    .getByRole("menuitem", { name: "Merge selected cells", exact: true })
    .click()
  await expect(table.locator('[colspan="2"][rowspan="2"]')).toHaveCount(1)
  expect(
    JSON.parse(
      (await table
        .locator('[colspan="2"][rowspan="2"]')
        .getAttribute("data-editor-border")) ?? "null",
    ),
  ).toEqual({ top: "solid", bottom: "solid", start: "solid", end: "solid" })
  await table.locator('[colspan="2"]').click()
  await tableExample(page)
    .getByRole("button", { name: "No cell borders", exact: true })
    .click()
  await rowHandle(page).press("ArrowDown")

  for (const name of ["Reload table JSON", "Reload table HTML"]) {
    await tableExample(page).getByRole("button", { name, exact: true }).click()
    await expect(table.locator('[colspan="2"][rowspan="2"]')).toHaveAttribute(
      "data-editor-border",
      /hidden/,
    )
  }

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }

  const results = await new AxeBuilder({ page })
    .include('[data-testid="table-example"]')
    .analyze()

  await info.attach("table-edges-rows-axe.json", {
    body: JSON.stringify(results),
    contentType: "application/json",
  })
  expect(results.violations).toEqual([])
})

test("individual hidden and default edges do not erase other edges", async ({
  page,
}) => {
  const table = await insert(page)
  const cell = table.locator("th,td").first()
  await tableExample(page)
    .getByRole("button", { name: "Top cell border", exact: true })
    .click()

  const style = tableExample(page).getByRole("combobox", {
    name: "Border edge style",
    exact: true,
  })

  await style.selectOption("hidden")
  await tableExample(page)
    .getByRole("button", { name: "End cell border", exact: true })
    .click()
  await expect(cell).toHaveCSS("border-top-style", "solid")
  await expect(cell).toHaveCSS("border-inline-end-style", "hidden")
  await expect(table.locator("th,td").nth(1)).toHaveCSS(
    "border-inline-start-style",
    "hidden",
  )
  await style.selectOption("reset")
  await tableExample(page)
    .getByRole("button", { name: "End cell border", exact: true })
    .click()
  await expect(cell).toHaveAttribute("data-editor-border", /"end":null/)
  await expect(cell).toHaveAttribute("data-editor-border", /"top":"solid"/)
})

test("concurrent keyboard commit cancels row preview without reverting new content", async ({
  page,
}) => {
  const table = await insert(page)
  const handle = rowHandle(page)
  await handle.press("Home")
  await table.locator("th,td").first().click()
  await beginDrag(page)
  await expect(handle).not.toBeFocused()
  await page.keyboard.press("Escape")
  await page.mouse.up()
  await handle.focus()
  await beginDrag(page)
  await handle.press("ArrowDown")
  await page.mouse.up()
  await expect(handle).toHaveAttribute("aria-valuenow", "10")
  await expect(table.getByRole("row").first()).toHaveCSS("height", /px$/)
})

test("native Chromium touch commits and cancels row resizing", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Native CDP touch input requires Chromium",
  )
  const table = await insert(page)
  const handle = rowHandle(page)
  await handle.press("Home")
  const box = await handle.boundingBox()

  if (!box) throw new Error("Row separator unavailable")
  const session = await context.newCDPSession(page)
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  })
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...point, y: point.y + 60 }],
  })
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  expect(Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThan(0)
  const before = await handle.getAttribute("aria-valuenow")
  await handle.scrollIntoViewIfNeeded()

  const nextBox = await handle.boundingBox()
  const row = table.getByRole("row").first()
  const beforeCancel = await row.boundingBox()

  if (!nextBox || !beforeCancel) throw new Error("Row separator unavailable")

  const nextPoint = {
    x: nextBox.x + nextBox.width / 2,
    y: nextBox.y + nextBox.height / 2,
    id: 1,
  }

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [nextPoint],
  })
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ ...nextPoint, y: nextPoint.y + 90 }],
  })
  await expect
    .poll(async () => (await row.boundingBox())?.height ?? 0)
    .toBeGreaterThan(beforeCancel.height)
  await session.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  })
  await expect(handle).toHaveAttribute("aria-valuenow", before ?? "")
  await expect
    .poll(async () => (await row.boundingBox())?.height ?? 0)
    .toBe(beforeCancel.height)
  await expect(table).toBeVisible()
  await session.detach()
})

test("legacy conflicting neighbors keep solid shared edges visible without rewriting NodeState", async ({
  page,
}) => {
  const table = await insert(page)
  const output = page.getByLabel("Serialized table state", { exact: true })

  const state = z
    .looseObject({
      root: z.looseObject({
        children: z.array(z.record(z.string(), z.unknown())),
      }),
    })
    .parse(JSON.parse((await output.textContent()) ?? "null"))

  const node = state.root.children.find((child) => child.type === "table")

  if (!node) throw new Error("Table unavailable")

  const rows = z
    .array(
      z.looseObject({ children: z.array(z.record(z.string(), z.unknown())) }),
    )
    .parse(node.children)

  const first = rows[0]?.children[0]
  const second = rows[0]?.children[1]

  if (!first || !second) throw new Error("Cells unavailable")
  first.$ = { yopemTableBorder: "solid", host: "keep" }
  second.$ = { yopemTableBorder: "hidden" }
  node.children = rows
  await tableExample(page)
    .getByRole("textbox", { name: "Table JSON input", exact: true })
    .fill(JSON.stringify(state))
  await tableExample(page)
    .getByRole("button", { name: "Import table JSON", exact: true })
    .click()
  await expect(table.locator("th,td").first()).toHaveAttribute(
    "data-editor-border",
    "solid",
  )
  await expect(table.locator("th,td").nth(1)).toHaveAttribute(
    "data-editor-border",
    "hidden",
  )

  for (const name of ["Reload table JSON", "Reload table HTML"]) {
    await expect(table.locator("th,td").first()).toHaveCSS(
      "border-inline-end-style",
      "solid",
    )
    await expect(table.locator("th,td").nth(1)).toHaveCSS(
      "border-inline-start-style",
      "solid",
    )
    await tableExample(page).getByRole("button", { name, exact: true }).click()
  }
})

test("row ARIA and JSON/HTML keep finite native values without scientific notation @a11y", async ({
  page,
}) => {
  test.slow()
  const table = await insert(page)

  for (const [index, header] of (await table.locator("th").all()).entries()) {
    await header.click()
    await page.keyboard.insertText(`Header ${index + 1}`)
  }

  const output = tableExample(page).getByLabel("Serialized table state", {
    exact: true,
  })

  const stateSchema = z.looseObject({
    root: z.looseObject({
      children: z.array(z.record(z.string(), z.unknown())),
    }),
  })

  const state = stateSchema.parse(
    JSON.parse((await output.textContent()) ?? "null"),
  )

  const node = state.root.children.find((child) => child.type === "table")

  if (!node) throw new Error("Table unavailable")
  const rows = z.array(z.record(z.string(), z.unknown())).parse(node.children)
  const row = rows[0]

  if (!row) throw new Error("Row unavailable")

  for (const height of [
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
    900,
    Number.MAX_VALUE,
  ]) {
    row.height = height
    node.children = rows
    await tableExample(page)
      .getByRole("textbox", { name: "Table JSON input", exact: true })
      .fill(JSON.stringify(state))
    await tableExample(page)
      .getByRole("button", { name: "Import table JSON", exact: true })
      .click()

    const viewport = await surface(page)
      .locator('[data-slot="editor-table-scroll"]')
      .boundingBox()

    if (!viewport) throw new Error("Table viewport unavailable")
    expect(viewport.height).toBeLessThanOrEqual(
      await page.evaluate(() => innerHeight),
    )
    await table.locator("th,td").first().click()
    const handle = rowHandle(page)
    await expect(handle).toHaveAttribute(
      "aria-valuenow",
      /^-?[0-9]+(?:\.[0-9]+)?$/,
    )
    await expect(handle).toHaveAttribute(
      "aria-valuemin",
      /^-?[0-9]+(?:\.[0-9]+)?$/,
    )
    await expect(handle).toHaveAttribute("aria-valuemax", /^[0-9]+$/)
    expect(Number(await handle.getAttribute("aria-valuenow"))).toBe(height)
    expect(Number(await handle.getAttribute("aria-valuemax"))).toBe(
      Number.MAX_VALUE,
    )

    for (const name of ["Reload table JSON", "Reload table HTML"]) {
      await tableExample(page)
        .getByRole("button", { name, exact: true })
        .click()
      await expect
        .poll(async () => {
          const latest = stateSchema.parse(
            JSON.parse((await output.textContent()) ?? "null"),
          )

          const latestTable = latest.root.children.find(
            (child) => child.type === "table",
          )

          return z
            .array(z.record(z.string(), z.unknown()))
            .parse(latestTable?.children)[0]?.height
        })
        .toBe(height)
    }
  }

  row.height = 900
  await tableExample(page)
    .getByRole("textbox", { name: "Table JSON input", exact: true })
    .fill(JSON.stringify(state))
  await tableExample(page)
    .getByRole("button", { name: "Import table JSON", exact: true })
    .click()
  await table.locator("th,td").first().click()

  const results = await new AxeBuilder({ page })
    .include('[data-testid="table-example"]')
    .analyze()

  expect(results.violations).toEqual([])
})

test("invalid row height HTML paste preserves selected content and reports failure @a11y", async ({
  page,
  context,
}) => {
  test.slow()
  await page.goto("/docs/editor")
  await expect(surface(page)).toHaveAttribute("contenteditable", "true")
  await surface(page).fill("Keep this")
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(
          [
            '<table><tr data-editor-row-height="1e309"><td>Unexpected</td></tr></table>',
          ],
          { type: "text/html" },
        ),
      }),
    ])
  })
  await surface(page).press("ControlOrMeta+a")
  await surface(page).press("ControlOrMeta+V")
  await expect(surface(page)).toHaveText("Keep this")
  await expect(surface(page).getByRole("table")).toHaveCount(0)
  await expect(tableExample(page).getByRole("alert")).toBeVisible()
  await expect(surface(page)).toHaveAttribute("contenteditable", "true")

  const results = await new AxeBuilder({ page })
    .include('[data-testid="table-example"]')
    .analyze()

  expect(results.violations).toEqual([])
})
