import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("composed editor uses selected controls and keeps its own state", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Composed editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Custom formatting",
    exact: true,
  })

  const preset = page.getByRole("textbox", {
    name: "Rich text editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Composable notes")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator("strong, b")).toHaveText("Composable notes")
  await toolbar.getByRole("button", { name: "Heading 2", exact: true }).click()
  await expect(editor.locator("h2")).toHaveText("Composable notes")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("h2")).toHaveCount(0)
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("h2")).toHaveText("Composable notes")
  await expect(preset).toBeEmpty()
  await expect(
    toolbar.getByRole("button", { name: "Insert table", exact: true }),
  ).toHaveCount(0)
  await testInfo.attach("composed-editor.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("@a11y composed format controls render highlight and letter case", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Composed editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Custom formatting",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("selected words")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Highlight", exact: true }).click()
  await expect(editor.locator("mark")).toBeVisible()
  await toolbar.getByRole("button", { name: "Uppercase", exact: true }).click()
  await expect(editor).toHaveText("SELECTED WORDS", { useInnerText: true })
  await toolbar.getByRole("button", { name: "Lowercase", exact: true }).click()
  await expect(editor).toHaveText("selected words", { useInnerText: true })
  await toolbar.getByRole("button", { name: "Capitalize", exact: true }).click()
  await expect(editor).toHaveText("Selected Words", { useInnerText: true })
  await editor.press("ArrowRight")
  await editor.screenshot({
    path: testInfo.outputPath("editor-highlight.png"),
    scale: "css",
  })
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("editor-formats-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
})

test("@a11y link bookmarks reject host document replacement", async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Extended editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Extension commands",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Original link")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Link", exact: true }).click()
  const url = page.getByRole("textbox", { name: "Link URL", exact: true })
  await url.fill("https://example.com/initial")
  await page.getByRole("button", { name: "Apply link", exact: true }).click()
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com/initial",
  )
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Link", exact: true }).click()
  const apply = page.getByRole("button", { name: "Apply link", exact: true })
  const remove = page.getByRole("button", { name: "Remove link", exact: true })
  await expect(apply).toBeEnabled()
  await expect(remove).toBeEnabled()
  await url.press("Alt+Shift+R")
  await expect(editor).toHaveText("Replacement content")
  await expect(apply).toBeDisabled()
  await expect(remove).toBeDisabled()
  await expect(
    page.getByRole("dialog", { name: "Link", exact: true }).getByRole("status"),
  ).toBeVisible()
  await url.press("Enter")
  await expect(editor).toHaveText("Replacement content")
  await expect(editor.locator("a")).toHaveCount(0)
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("editor-replacement-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  expect(errors).toEqual([])
})

test("composed root registers custom extensions once per mount", async ({
  page,
}) => {
  for (const visit of [0, 1]) {
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Extended editor",
      exact: true,
    })

    const toolbar = page.getByRole("toolbar", {
      name: "Extension commands",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.click()
    await toolbar
      .getByRole("button", { name: "Insert note", exact: true })
      .click()
    await expect(editor).toHaveText("Extension note")
    await page.goto(
      visit === 0 ? "/docs/getting-started" : "/components/editor",
    )
  }
})

test("@a11y composed editor toolbar supports keyboard operation", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Composed editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Custom formatting",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keyboard notes")
  await editor.press("ControlOrMeta+a")
  await toolbar.getByRole("button", { name: "Bold", exact: true }).focus()
  await page.keyboard.press("Enter")
  await expect(editor.locator("strong, b")).toHaveText("Keyboard notes")
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("composed-editor-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await editor.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: testInfo.outputPath("editor-composition.png"),
    scale: "css",
  })
})

test("@a11y composed editor switches subscript and superscript", async ({
  page,
}, testInfo) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Composed editor",
    exact: true,
  })

  const toolbar = page.getByRole("toolbar", {
    name: "Custom formatting",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("H2O")
  await editor.press("Home")
  await editor.press("ArrowRight")
  await editor.press("Shift+ArrowRight")
  await toolbar.getByRole("button", { name: "Subscript", exact: true }).click()
  await expect(editor.locator("sub")).toHaveText("2")

  const size = await editor
    .getByText("2", { exact: true })
    .evaluate((element) => getComputedStyle(element).fontSize)

  await toolbar.getByRole("button", { name: "Highlight", exact: true }).click()
  await expect(editor.getByText("2", { exact: true })).toHaveCSS(
    "font-size",
    size,
  )
  await toolbar.getByRole("button", { name: "Highlight", exact: true }).click()
  await expect(editor.locator("sub")).toHaveText("2")
  await toolbar
    .getByRole("button", { name: "Superscript", exact: true })
    .click()
  await expect(editor.locator("sub")).toHaveCount(0)
  await expect(editor.locator("sup")).toHaveText("2")
  await toolbar
    .getByRole("button", { name: "Superscript", exact: true })
    .click()
  await expect(editor.locator("sup")).toHaveCount(0)
  await expect(editor).toHaveText("H2O")
  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator("sup")).toHaveText("2")
  await editor.press("ArrowRight")
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("editor-scripts-axe.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await editor.screenshot({
    path: testInfo.outputPath("editor-scripts.png"),
    scale: "css",
  })
})
