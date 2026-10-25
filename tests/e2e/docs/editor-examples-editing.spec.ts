import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page, context }) => {
  test.slow()
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/editor/examples#public-editing-rules")
  const example = page.getByTestId("editor-example-public-editing-rules")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  for (const name of ["Exit break editor", "Single block editor"]) {
    await expect(
      example.getByRole("textbox", { name, exact: true }),
    ).toHaveAttribute("contenteditable", "true")
  }
})

test("exit break leaves native quote, code, and table boundaries without changing their content", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Exit break editor",
    exact: true,
  })

  await editor.locator("blockquote").click()
  await page.keyboard.press("End")
  await page.keyboard.press("ControlOrMeta+Enter")
  await expect(editor.locator("blockquote + p")).toHaveCount(1)
  await expect(editor.locator("blockquote")).toHaveText("Quoted boundary")
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator("blockquote + p")).toHaveCount(0)
  await editor.locator("code").click()
  await page.keyboard.press("Home")
  await page.keyboard.press("ControlOrMeta+Shift+Enter")
  await expect(editor.locator("p + code")).toHaveCount(1)
  await expect(editor.locator("code")).toContainText("Code boundary")
  await editor.press("ControlOrMeta+z")
  const cell = editor.getByRole("cell")
  await cell.click()
  await page.keyboard.press("End")
  await page.keyboard.press("ControlOrMeta+Enter")
  await expect(editor.locator(":scope > p")).toHaveCount(1)
  await expect(cell).toHaveText("Cell boundary")
})

test("single-paragraph modes preserve one paragraph for Enter, modifier shortcuts and native paste", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Single block editor",
    exact: true,
  })

  await editor.fill("One")
  await editor.press("End")
  await editor.press("Enter")
  await page.keyboard.type("Two")
  await expect(editor.locator(":scope > p")).toHaveCount(1)
  await expect(editor.locator("br")).toHaveCount(1)
  await editor.press("ControlOrMeta+Enter")
  await expect(editor.locator(":scope > p")).toHaveCount(1)
  await page.getByRole("button", { name: "Single line", exact: true }).click()
  await editor.fill("One")
  await editor.press("End")
  await page.evaluate(() => navigator.clipboard.writeText("A\r\nB\nC"))
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("OneABC")
  await expect(editor.locator("br")).toHaveCount(0)
  await editor.press("ControlOrMeta+Shift+Enter")
  await expect(editor).toHaveText("OneABC")
  await expect(editor.locator(":scope > p")).toHaveCount(1)
})

test("single-paragraph rich and empty native clipboard payloads preserve selected content", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Single block editor",
    exact: true,
  })

  await editor.fill("Keep this selection")
  await editor.press("ControlOrMeta+a")
  await page.evaluate(() =>
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(["<h2>Rejected rich heading</h2>"], {
          type: "text/html",
        }),
        "text/plain": new Blob(["Rejected rich heading"], {
          type: "text/plain",
        }),
      }),
    ]),
  )
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep this selection")
  await page.evaluate(() => navigator.clipboard.writeText(""))
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep this selection")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-editing-rules"]')
    .analyze()

  expect(report.violations).toEqual([])
})

test("single-line newline-only and oversized paste never removes the selection", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Single block editor",
    exact: true,
  })

  await page.getByRole("button", { name: "Single line", exact: true }).click()

  for (const text of ["\r\n\n", "x".repeat(1048577)]) {
    await editor.fill("Keep selected content")
    await editor.press("ControlOrMeta+a")
    await page.evaluate((value) => navigator.clipboard.writeText(value), text)
    await editor.press("ControlOrMeta+v")
    await expect(editor).toHaveText("Keep selected content")
    await expect(editor.locator(":scope > p")).toHaveCount(1)
  }
})

test("editing rules keep read-only documents unchanged and accessible", async ({
  page,
}, testInfo) => {
  await page
    .getByRole("button", { name: "Make rule editors read-only", exact: true })
    .click()

  for (const name of ["Exit break editor", "Single block editor"]) {
    const editor = page.getByRole("textbox", { name, exact: true })
    await expect(editor).toHaveAttribute("contenteditable", "false")
    const before = await editor.innerText()
    await editor.click()
    await page.keyboard.press("ControlOrMeta+Enter")
    await page.keyboard.type("Must not change")
    await expect.poll(() => editor.innerText()).toBe(before)
  }

  const example = page.getByTestId("editor-example-public-editing-rules")

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await testInfo.attach(`editing-rules-${width}.png`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  expect(
    (
      await new AxeBuilder({ page })
        .include('[data-testid="editor-example-public-editing-rules"]')
        .analyze()
    ).violations,
  ).toEqual([])
})
