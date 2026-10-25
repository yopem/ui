import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

const aiRequestSelectionSchema = z.looseObject({
  selectedText: z.string().nullable().optional(),
})

function example(page: Page) {
  return page.getByTestId("editor-example-public-block-menu")
}

async function editorSurface(page: Page) {
  const root = example(page)

  const preview = root.getByRole("button", {
    name: "Live preview",
    exact: true,
  })

  if ((await preview.getAttribute("aria-expanded")) === "false")
    await preview.click()

  const editor = root.getByRole("textbox", {
    name: "Public block menu editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return editor
}

async function openForBlock(
  page: Page,
  editor: Awaited<ReturnType<typeof editorSurface>>,
  index = 0,
) {
  await editor.locator(":scope > *").nth(index).click({ button: "right" })
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()

  return menu
}

function selectedText(page: Page) {
  return page.evaluate(() => window.getSelection()?.toString() ?? "")
}

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-block-menu")
})

test("selected-text right-click opens authorized comment composer, preserves focus, and supports Undo @a11y", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  await editor.fill("Comment anchor")
  await editor.press("Home")
  await editor.press("Shift+End")
  expect(await selectedText(page)).toBe("Comment anchor")

  const menu = await openForBlock(page, editor)
  expect(await selectedText(page)).toBe("Comment anchor")
  await menu.getByRole("menuitem", { name: "Add comment", exact: true }).click()

  const dialog = page.getByRole("dialog", {
    name: "Comment on selected text",
    exact: true,
  })

  await expect(dialog).toBeVisible()
  await expect(dialog.locator(":focus")).toHaveCount(1)
  await expect(
    dialog.getByRole("region", { name: "Selected text", exact: true }),
  ).toHaveText("Comment anchor")

  const dialogAxe = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()

  expect(dialogAxe.violations).toEqual([])
  await dialog
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await dialog
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Review this selected text")
  await dialog.getByRole("button", { name: "Add comment", exact: true }).click()
  await dialog.getByRole("button", { name: "Close", exact: true }).click()

  const review = page.getByRole("complementary", {
    name: "Document review",
    exact: true,
  })

  await expect(review.getByRole("article")).toHaveCount(1)
  await expect(review).toContainText("Review this selected text")
  await expect(editor).toHaveText("Comment anchor")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(review.getByRole("article")).toHaveCount(0)
  await expect(editor).toHaveText("Comment anchor")

  const editorAxe = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-block-menu"]')
    .analyze()

  expect(editorAxe.violations).toEqual([])
})

test("comment policy and host event cancellation prevent creation; Cancel keeps document unchanged", async ({
  page,
}) => {
  const root = example(page)
  const editor = await editorSurface(page)
  await editor.fill("No comment without permission")
  await editor.press("Home")
  await editor.press("Shift+End")

  const comments = root.getByRole("checkbox", {
    name: "Host currently permits comments",
    exact: true,
  })

  await comments.uncheck()
  let menu = await openForBlock(page, editor)
  await menu.getByRole("menuitem", { name: "Add comment", exact: true }).click()

  const dialog = page.getByRole("dialog", {
    name: "Comment on selected text",
    exact: true,
  })

  await expect(dialog).toHaveCount(0)
  await expect(editor).toHaveText("No comment without permission")
  await comments.check()

  menu = await openForBlock(page, editor)
  await menu.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    })
  })
  await menu.getByRole("menuitem", { name: "Add comment", exact: true }).click()
  await expect(dialog).toHaveCount(0)

  menu = await openForBlock(page, editor)
  await menu.getByRole("menuitem", { name: "Add comment", exact: true }).click()
  await expect(dialog).toBeVisible()
  await dialog
    .getByRole("button", { name: "Comment on selection", exact: true })
    .click()
  await dialog
    .getByRole("textbox", { name: "New comment", exact: true })
    .fill("Discard this draft")
  await page.keyboard.press("Alt+Shift+C")
  await expect(
    dialog.getByRole("button", { name: "Add comment", exact: true }),
  ).toBeDisabled()
  await dialog
    .getByRole("button", { name: "Cancel comment", exact: true })
    .click()
  await dialog.getByRole("button", { name: "Close", exact: true }).click()
  await comments.check()
  await expect(
    page
      .getByRole("complementary", { name: "Document review", exact: true })
      .getByRole("article"),
  ).toHaveCount(0)

  await root
    .getByRole("button", {
      name: "Make block menu editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  menu = await openForBlock(page, editor)
  await menu.getByRole("menuitem", { name: "Add comment", exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Comment on selection", exact: true }),
  ).toBeDisabled()
  await expect(dialog.getByRole("status")).toContainText("editor state")
  await dialog.getByRole("button", { name: "Close", exact: true }).click()
  await expect(editor).toHaveText("No comment without permission")
})

test("host setup rejects blank CSRF and removes the configured input value", async ({
  page,
}) => {
  let requests = 0
  await page.route("**/__context_setup_ai", async (route) => {
    requests += 1
    await route.fulfill({ status: 503, body: "Unavailable" })
  })

  await editorSurface(page)
  const root = example(page)
  const csrf = root.getByLabel("AI host CSRF token")

  const configure = root.getByRole("button", {
    name: "Configure AI host",
    exact: true,
  })

  await root.getByLabel("AI host endpoint").fill("/__context_setup_ai")
  await root.getByLabel("AI host document ID").fill("context-source-document")
  await csrf.fill("   ")
  await configure.click()
  await expect(root.getByRole("alert")).toBeVisible()
  await expect(configure).toBeEnabled()

  await csrf.fill("context-source-token")
  await configure.click()
  await expect(configure).toBeDisabled()
  await expect(csrf).toHaveValue("")
  await expect(root.getByRole("alert")).toHaveCount(0)
  expect(requests).toBe(0)
})

test("Ask AI restores captured selection and sends it only after explicit request @a11y", async ({
  page,
}) => {
  let requests = 0
  let requestedSelection: string | null = null

  await page.route("**/__source-only-ai", async (route) => {
    requests++
    const body = route.request().postData()

    if (body) {
      const payload = aiRequestSelectionSchema.parse(JSON.parse(body))
      requestedSelection = payload.selectedText ?? null
    }

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: 'event: text\ndata: {"text":"Captured response"}\n\nevent: complete\ndata: {"version":1}\n\n',
    })
  })

  const root = example(page)
  const editor = await editorSurface(page)
  await editor.fill("Selected AI text")
  await editor.press("Home")
  await editor.press("Shift+End")

  const menu = await openForBlock(page, editor)
  await menu.getByRole("menuitem", { name: "Ask AI", exact: true }).click()
  await expect(
    root.getByRole("region", { name: "AI action context" }),
  ).toBeVisible()
  await expect(
    root.getByRole("button", { name: "Open AI proposal", exact: true }),
  ).toHaveCount(0)
  expect(await selectedText(page)).toBe("Selected AI text")
  expect(requests).toBe(0)
  await editor.press("End")
  expect(await selectedText(page)).toBe("")

  await root.getByLabel("AI host endpoint").fill("/__source-only-ai")
  await root.getByLabel("AI host document ID").fill("source-only-document")
  await root.getByLabel("AI host CSRF token").fill("source-only-token")
  await root
    .getByRole("checkbox", {
      name: "Host currently permits AI requests",
      exact: true,
    })
    .check()
  await root
    .getByRole("button", { name: "Configure AI host", exact: true })
    .click()

  await expect(
    root.getByRole("button", { name: "Open AI proposal", exact: true }),
  ).toBeVisible()
  await root
    .getByRole("button", { name: "Open AI proposal", exact: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "AI proposal", exact: true })

  await expect(dialog.getByLabel("AI instruction")).toBeVisible()

  const aiAxe = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze()

  expect(aiAxe.violations).toEqual([])
  expect(requests).toBe(0)
  await dialog.getByLabel("AI instruction").fill("Summarize selected text")
  await dialog
    .getByRole("button", { name: "Request proposal", exact: true })
    .click()
  await expect.poll(() => requests).toBe(1)
  expect(requestedSelection).toBe("Selected AI text")
  await expect(
    dialog.getByText("Captured response", { exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(editor).toHaveText("Selected AI text")
  await root
    .getByRole("button", { name: "Open AI proposal", exact: true })
    .click()
  await expect(dialog).toBeVisible()
  await root
    .getByRole("checkbox", {
      name: "Host currently permits AI requests",
      exact: true,
    })
    .uncheck()
  await expect(dialog).toHaveCount(0)
  await root
    .getByRole("button", { name: "Close AI context", exact: true })
    .click()
  expect(requests).toBe(1)
})

test("Code drawing restores captured selection and uses native history @a11y", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  await editor.locator(":scope > *").nth(1).click()
  await editor.press("Home")
  await editor.press("Shift+End")
  expect(await selectedText(page)).toBe("Second block")
  const menu = await openForBlock(page, editor, 1)
  await menu
    .getByRole("menuitem", { name: "Code drawing", exact: true })
    .click()
  expect(await selectedText(page)).toBe("Second block")

  const toolbar = page.getByRole("toolbar", {
    name: "Block menu diagram controls",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await toolbar
    .getByRole("button", { name: "Insert diagram", exact: true })
    .click()
  await expect(editor).toContainText("A[Start] --> B[Finish]")
  await expect(editor).not.toContainText("Second block")
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).toHaveText("First blockSecond block")
  await page.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor).toContainText("A[Start] --> B[Finish]")

  const diagramType = toolbar.getByRole("combobox", {
    name: "Diagram type",
    exact: true,
  })

  const diagramView = toolbar.getByRole("combobox", {
    name: "Diagram view",
    exact: true,
  })

  await expect(diagramType).toBeEnabled()
  await diagramType.selectOption("graphviz")
  await expect(diagramType).toHaveValue("graphviz")
  await diagramView.selectOption("code")
  await expect(diagramView).toHaveValue("code")
  await expect(toolbar).toContainText("No graphviz renderer is configured.")
  await toolbar
    .getByRole("button", { name: "Delete diagram", exact: true })
    .click()
  await expect(editor).not.toContainText("A[Start] --> B[Finish]")

  const readOnly = example(page).getByRole("button", {
    name: "Make block menu editor read-only",
    exact: true,
  })

  await readOnly.click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    toolbar.getByRole("button", { name: "Insert diagram", exact: true }),
  ).toBeDisabled()

  const axe = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-block-menu"]')
    .analyze()

  expect(axe.violations).toEqual([])
})

test("native duplicate, conversion, indent, alignment, and delete actions remain available", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  await expect(editor.locator(":scope > *")).toHaveCount(2)

  let menu = await openForBlock(page, editor, 0)
  await menu.getByRole("menuitem", { name: "Heading 2", exact: true }).click()
  await expect(editor.locator(":scope > h2").first()).toHaveText("First block")

  menu = await openForBlock(page, editor, 0)
  const beforeIndent = await editor.innerHTML()
  await menu.getByRole("menuitem", { name: "Indent", exact: true }).click()
  await expect.poll(() => editor.innerHTML()).not.toBe(beforeIndent)

  menu = await openForBlock(page, editor, 0)
  await menu
    .getByRole("menuitem", { name: "Align center", exact: true })
    .click()
  await expect(editor.locator(":scope > h2").first()).toHaveCSS(
    "text-align",
    "center",
  )

  menu = await openForBlock(page, editor, 1)
  await menu
    .getByRole("menuitem", { name: "Duplicate block", exact: true })
    .click()
  await expect(editor.locator(":scope > *")).toHaveCount(3)

  menu = await openForBlock(page, editor, 2)
  await menu
    .getByRole("menuitem", { name: "Delete block", exact: true })
    .click()
  await expect(editor.locator(":scope > *")).toHaveCount(2)
  await expect(editor.locator(":scope > h2").first()).toHaveText("First block")
})

test("content changes close the captured block target before any host action runs", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  const menu = await openForBlock(page, editor)
  await editor.fill("Host replacement")
  await expect(menu).toHaveCount(0)
  await expect(
    page.getByRole("dialog", { name: "Comment on selected text", exact: true }),
  ).toHaveCount(0)
  await expect(editor).toHaveText("Host replacement")
})
