import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function styledEditor(page: Page) {
  return page.getByRole("textbox", { name: "Styled editor", exact: true })
}

async function applyStyle(page: Page, name: string, value: string) {
  await page
    .getByRole("toolbar", { name: "Text styles", exact: true })
    .getByRole("button", { name, exact: true })
    .click()
  await page
    .getByRole("textbox", { name: `${name} value`, exact: true })
    .fill(value)
  await page.getByRole("button", { name: `Apply ${name}`, exact: true }).click()
}

test("text styles retain selection, reject unsafe values, clear and undo", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)

  const toolbar = page.getByRole("toolbar", {
    name: "Text styles",
    exact: true,
  })

  await editor.fill("Alpha")
  await editor.press("Enter")
  await editor.pressSequentially("Beta")
  await editor.press("ControlOrMeta+a")

  for (const [name, value, property, expected] of [
    ["Font color", "#ff0000", "color", "rgb(255, 0, 0)"],
    ["Background color", "#ffff00", "background-color", "rgb(255, 255, 0)"],
    ["Font family", "Georgia", "font-family", "Georgia"],
    ["Font size", "24px", "font-size", "24px"],
    ["Font weight", "700", "font-weight", "700"],
  ]) {
    await applyStyle(page, name, value)
    await expect(editor.locator("p").first().locator("span").first()).toHaveCSS(
      property,
      expected,
    )
    await expect(editor.locator("p").last().locator("span").first()).toHaveCSS(
      property,
      expected,
    )
  }

  await applyStyle(page, "Line height", "2")
  await applyStyle(page, "First-line indent", "24px")

  for (const paragraph of await editor.locator("p").all()) {
    await expect
      .poll(() => paragraph.evaluate((element) => element.style.lineHeight))
      .toBe("2")
    await expect(paragraph).toHaveCSS("text-indent", "24px")
  }

  await toolbar
    .getByRole("button", { name: "Align center", exact: true })
    .click()
  await expect(editor.locator("p").first()).toHaveCSS("text-align", "center")
  await toolbar.getByRole("button", { name: "Indent", exact: true }).click()
  await expect(editor.locator("p").first()).not.toHaveCSS(
    "padding-inline-start",
    "0px",
  )
  await toolbar.getByRole("button", { name: "Font color", exact: true }).click()
  await page
    .getByRole("textbox", { name: "Font color value", exact: true })
    .fill("red; background: url(https://invalid.example)")

  const before = await page
    .getByLabel("Styled editor JSON", { exact: true })
    .textContent()

  await page
    .getByRole("button", { name: "Apply Font color", exact: true })
    .click()
  await expect(
    page.getByRole("textbox", { name: "Font color value", exact: true }),
  ).toHaveAttribute("aria-invalid", "true")
  await expect(
    page.getByLabel("Styled editor JSON", { exact: true }),
  ).toHaveText(before!)
  await page.keyboard.press("Escape")
  await editor.press("ControlOrMeta+a")
  await toolbar
    .getByRole("button", { name: "Clear formatting", exact: true })
    .click()
  await expect(editor).toHaveText("AlphaBeta")
  await expect(editor.locator("p").first()).toHaveCSS("text-indent", "0px")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("p").first()).toHaveCSS("text-indent", "24px")
  await testInfo.attach("editor-styles.json", {
    body: (await page
      .getByLabel("Styled editor JSON", { exact: true })
      .textContent())!,
    contentType: "application/json",
  })
})

test("keyboard partial selection changes only chosen text", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)
  await editor.fill("Alpha Beta")
  await editor.press("Home")

  for (let index = 0; index < 5; index++) await editor.press("Shift+ArrowRight")
  await page.getByRole("button", { name: "Font size", exact: true }).focus()
  await page.keyboard.press("Enter")
  await page
    .getByRole("textbox", { name: "Font size value", exact: true })
    .fill("32px")
  await page
    .getByRole("button", { name: "Apply Font size", exact: true })
    .click()
  await expect(editor.getByText("Alpha", { exact: true })).toHaveCSS(
    "font-size",
    "32px",
  )
  await expect(editor.getByText(" Beta", { exact: true })).not.toHaveCSS(
    "font-size",
    "32px",
  )
})

test("@a11y styles initial, changed, popup and readonly states", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)

  for (const state of ["initial", "changed", "popup"]) {
    if (state === "changed") {
      await editor.fill("Readable text")
      await editor.press("ControlOrMeta+a")
      await applyStyle(page, "Font weight", "700")
    }

    if (state === "popup")
      await page
        .getByRole("button", { name: "Font family", exact: true })
        .click()
    const report = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`${state}-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
  }

  await page.keyboard.press("Escape")
  await page
    .getByRole("button", { name: "Make styled editor readonly", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")

  for (const button of await page
    .getByRole("toolbar", { name: "Text styles", exact: true })
    .getByRole("button")
    .all())
    await expect(button).toBeDisabled()
  const readonlyReport = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
  expect(readonlyReport.violations).toEqual([])
  await editor.screenshot({
    path: testInfo.outputPath("editor-styles.png"),
    scale: "css",
  })
})

test("invalid style inputs fail without document changes", async ({ page }) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)
  await editor.fill("Safe text")

  for (const [name, value] of [
    ["Font family", "Arial; color:red"],
    ["Font size", "Infinitypx"],
    ["Font weight", "1000"],
    ["Line height", "0"],
    ["First-line indent", "-1px"],
    ["Background color", "url(https://invalid.example)"],
  ]) {
    await editor.press("ControlOrMeta+a")

    const before = await page
      .getByLabel("Styled editor JSON", { exact: true })
      .textContent()

    await applyStyle(page, name, value)
    await expect(
      page.getByRole("textbox", { name: `${name} value`, exact: true }),
    ).toHaveAttribute("aria-invalid", "true")
    await expect(
      page.getByLabel("Styled editor JSON", { exact: true }),
    ).toHaveText(before!)
    await page.keyboard.press("Escape")
  }
})

test("pointer selection survives popup and changed content invalidates bookmark", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)
  await editor.fill("Alpha Beta")
  await editor.dblclick({ position: { x: 24, y: 24 } })
  await applyStyle(page, "Font size", "32px")
  await expect(editor.getByText("Alpha", { exact: true })).toHaveCSS(
    "font-size",
    "32px",
  )
  await editor.press("ControlOrMeta+a")
  await page.getByRole("button", { name: "Font color", exact: true }).click()
  await editor.fill("Changed content")
  await expect(
    page.getByRole("button", { name: "Apply Font color", exact: true }),
  ).toBeDisabled()
  await page.keyboard.press("Escape")
})

test("clear keeps links and nested list structure", async ({ page }) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)

  const toolbar = page.getByRole("toolbar", {
    name: "Text styles",
    exact: true,
  })

  await editor.fill("Alpha")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Link", exact: true }).click()
  await page
    .getByRole("textbox", { name: "Link URL", exact: true })
    .fill("https://example.com/")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await toolbar
    .getByRole("button", { name: "Bullet list", exact: true })
    .click()
  await editor.press("ArrowRight")
  await editor.press("Enter")
  await editor.pressSequentially("Beta")
  await toolbar.getByRole("button", { name: "Indent", exact: true }).click()
  await expect(editor.locator("ul ul")).toBeVisible()
  await editor.press("ControlOrMeta+a")
  await applyStyle(page, "Font size", "24px")
  await toolbar
    .getByRole("button", { name: "Clear formatting", exact: true })
    .click()
  await expect(editor.locator("ul ul")).toBeVisible()
  await expect(
    editor.getByRole("link", { name: "Alpha", exact: true }),
  ).toHaveAttribute("href", "https://example.com/")
  await expect(editor).toContainText("Beta")
})

test("clear keeps table cells and content", async ({ page }) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)

  const toolbar = page.getByRole("toolbar", {
    name: "Text styles",
    exact: true,
  })

  await editor.click()
  await toolbar
    .getByRole("button", { name: "Insert table", exact: true })
    .click()

  const cell = editor.locator("td, th").first()

  await cell.click()
  await page.keyboard.type("Cell text")
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  await applyStyle(page, "Font size", "24px")
  await toolbar
    .getByRole("button", { name: "Clear formatting", exact: true })
    .click()
  await expect(editor.getByRole("table")).toBeVisible()
  await expect(cell).toHaveText("Cell text")
  await expect(cell.getByText("Cell text", { exact: true })).not.toHaveCSS(
    "font-size",
    "24px",
  )
})

test("block styles survive JSON and HTML reloads, including readonly rendering", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)
  await editor.fill("Round trip")
  await editor.press("ControlOrMeta+a")
  await applyStyle(page, "Line height", "2")
  await applyStyle(page, "First-line indent", "24px")

  for (const format of ["JSON", "HTML"]) {
    await page
      .getByRole("button", { name: `Save styled ${format}`, exact: true })
      .click()
    await editor.fill("Replacement")
    await page
      .getByRole("button", { name: `Load styled ${format}`, exact: true })
      .click()
    await expect(editor).toHaveText("Round trip")
    await expect(editor.locator("p")).toHaveCSS("text-indent", "24px")
    await expect
      .poll(() =>
        editor.locator("p").evaluate((element) => element.style.lineHeight),
      )
      .toBe("2")
  }

  await page
    .getByRole("button", { name: "Make styled editor readonly", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor.locator("p")).toHaveCSS("text-indent", "24px")
  await testInfo.attach("round-trip-html", {
    body: await page
      .getByRole("textbox", { name: "Styled HTML", exact: true })
      .inputValue(),
    contentType: "text/html",
  })
})

test("HTML validates presentation and preserves native block converters", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)
  await page
    .getByRole("textbox", { name: "Styled HTML", exact: true })
    .fill(
      '<h2 style="line-height:2;text-indent:1em">Heading</h2><blockquote style="line-height:3;text-indent:16px">Quote</blockquote><ul><li style="line-height:2;text-indent:10rem">Item</li></ul><p style="line-height:9;text-indent:-1px">Invalid</p>',
    )
  await page
    .getByRole("button", { name: "Load styled HTML", exact: true })
    .click()
  await expect(editor.locator("h2")).toHaveText("Heading")
  await expect
    .poll(() =>
      editor.locator("h2").evaluate((element) => element.style.textIndent),
    )
    .toBe("1em")
  await expect(editor.locator("blockquote")).toHaveText("Quote")
  await expect
    .poll(() =>
      editor.locator("li").evaluate((element) => element.style.textIndent),
    )
    .toBe("10rem")
  await expect
    .poll(() =>
      editor.locator("p").evaluate((element) => element.style.lineHeight),
    )
    .toBe("")
  await expect(editor.locator("p")).toHaveCSS("text-indent", "0px")
  await page
    .getByRole("button", { name: "Save styled HTML", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Load styled HTML", exact: true })
    .click()
  await expect
    .poll(() =>
      editor.locator("h2").evaluate((element) => element.style.textIndent),
    )
    .toBe("1em")
  await expect(editor.locator("blockquote")).toHaveCSS("text-indent", "16px")
  await expect
    .poll(() =>
      editor.locator("li").evaluate((element) => element.style.textIndent),
    )
    .toBe("10rem")
})

test("ordinary edits leave unmanaged and clean block DOM styles untouched", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)
  await page
    .getByRole("textbox", { name: "Styled HTML", exact: true })
    .fill(
      '<p>Unmanaged</p><p style="line-height:2">Managed</p><p>Edit here</p>',
    )
  await page
    .getByRole("button", { name: "Load styled HTML", exact: true })
    .click()
  await expect
    .poll(() =>
      editor
        .locator("p")
        .nth(1)
        .evaluate((element) => element.style.lineHeight),
    )
    .toBe("2")
  await editor
    .locator("p")
    .first()
    .evaluate((element) => {
      element.style.lineHeight = "3"
      element.style.textIndent = "8px"
    })
  await editor
    .locator("p")
    .nth(1)
    .evaluate((element) => {
      element.style.lineHeight = "3"
    })
  await editor.locator("p").last().click()
  await editor.press("End")
  await editor.pressSequentially(" changed")
  await expect
    .poll(() =>
      editor
        .locator("p")
        .first()
        .evaluate((element) => element.style.lineHeight),
    )
    .toBe("3")
  await expect(editor.locator("p").first()).toHaveCSS("text-indent", "8px")
  await expect
    .poll(() =>
      editor
        .locator("p")
        .nth(1)
        .evaluate((element) => element.style.lineHeight),
    )
    .toBe("3")
})

test("clear at a caret preserves existing text formatting", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  await expect(styledEditor(page)).toHaveAttribute("contenteditable", "true")
  const editor = styledEditor(page)

  const toolbar = page.getByRole("toolbar", {
    name: "Text styles",
    exact: true,
  })

  await editor.fill("Alpha")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
  await applyStyle(page, "Font size", "24px")
  await editor.press("ArrowRight")
  await toolbar
    .getByRole("button", { name: "Clear formatting", exact: true })
    .click()
  await expect(editor.getByText("Alpha", { exact: true })).toHaveCSS(
    "font-size",
    "24px",
  )
  await expect(editor.locator("strong, b")).toHaveText("Alpha")
  await editor.pressSequentially("Beta")
  await expect(editor).toHaveText("AlphaBeta")
  await expect(editor.getByText("Beta", { exact: true })).not.toHaveCSS(
    "font-size",
    "24px",
  )
  await expect(editor.locator("strong, b")).toHaveText("Alpha")
})

test("block and table HTML hooks retain both metadata sets through JSON and HTML", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  const editor = styledEditor(page)
  await expect(editor).toHaveAttribute("contenteditable", "true")
  const input = page.getByRole("textbox", { name: "Styled HTML", exact: true })
  await input.fill(
    '<table><tr><th data-editor-border="solid" style="line-height:2;text-indent:16px">Heading</th><td data-editor-border="hidden" style="line-height:3;text-indent:24px">Cell</td></tr></table>',
  )
  await page
    .getByRole("button", { name: "Load styled HTML", exact: true })
    .click()

  for (const format of ["JSON", "HTML"]) {
    await page
      .getByRole("button", { name: `Save styled ${format}`, exact: true })
      .click()
    await editor.fill("Replacement")
    await page
      .getByRole("button", { name: `Load styled ${format}`, exact: true })
      .click()
    await expect(editor.locator("th")).toHaveText("Heading")
    await expect(editor.locator("td")).toHaveText("Cell")
    await expect
      .poll(() =>
        editor.locator("th").evaluate((element) => element.style.lineHeight),
      )
      .toBe("2")
    await expect(editor.locator("th")).toHaveCSS("text-indent", "16px")
    await expect
      .poll(() =>
        editor.locator("td").evaluate((element) => element.style.lineHeight),
      )
      .toBe("3")
    await expect(editor.locator("td")).toHaveCSS("text-indent", "24px")
    await page
      .getByRole("button", { name: "Save styled HTML", exact: true })
      .click()
    await expect(input).toHaveValue(/data-editor-border="solid"/)
    await expect(input).toHaveValue(/data-editor-border="hidden"/)
  }
})

for (const width of [1440, 768, 390]) {
  test(`styled editor stays contained at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/docs/editor")
    const editor = styledEditor(page)
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("boundary".repeat(120))
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      )
      .toBe(true)
    await page
      .getByRole("region", { name: "Text style examples", exact: true })
      .screenshot({ path: testInfo.outputPath(`editor-styles-${width}.png`) })
  })
}
