import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { z } from "zod"

const diagramRequestSchema = z.strictObject({
  version: z.literal(1),
  kind: z.enum(["mermaid", "plantuml", "graphviz", "flowchart"]),
  source: z.string(),
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
  index: number,
) {
  await editor.locator(":scope > *").nth(index).click({ button: "right" })
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()

  return menu
}

function selectedText(page: Page) {
  return page.evaluate(() => window.getSelection()?.toString() ?? "")
}

async function openCodeDrawing(
  page: Page,
  editor: Awaited<ReturnType<typeof editorSurface>>,
  index: number,
) {
  const menu = await openForBlock(page, editor, index)
  await menu
    .getByRole("menuitem", { name: "Code drawing", exact: true })
    .press("Enter")

  return example(page).getByRole("region", {
    name: "Code drawing action context",
    exact: true,
  })
}

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-block-menu")
})

test("Code drawing restores selection and renders only after explicit Render @a11y", async ({
  page,
}, testInfo) => {
  const requests: {
    payload: z.infer<typeof diagramRequestSchema>
    headers: Record<string, string>
  }[] = []

  await page.route("**/__source-only-diagram", async (route) => {
    requests.push({
      payload: diagramRequestSchema.parse(
        JSON.parse(route.request().postData() ?? ""),
      ),
      headers: route.request().headers(),
    })
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml; charset=utf-8",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40"><text x="4" y="24">fixture</text></svg>',
    })
  })

  const root = example(page)
  const editor = await editorSurface(page)
  await editor.locator(":scope > *").nth(1).click()
  await editor.press("Home")
  await editor.press("Shift+End")
  expect(await selectedText(page)).toBe("Second block")

  await editor.press("Shift+F10")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(menu.locator(":focus")).toHaveCount(1)
  expect(await selectedText(page)).toBe("Second block")

  const menuAxe = await new AxeBuilder({ page })
    .include('[role="menu"]')
    .analyze()

  expect(menuAxe.violations).toEqual([])

  await menu
    .getByRole("menuitem", { name: "Code drawing", exact: true })
    .press("Enter")

  const context = root.getByRole("region", {
    name: "Code drawing action context",
    exact: true,
  })

  await expect(context).toBeVisible()
  expect(await selectedText(page)).toBe("Second block")

  const toolbar = context.getByRole("toolbar", {
    name: "Block menu diagram controls",
    exact: true,
  })

  await expect(root.getByLabel("Diagram host endpoint")).toBeVisible()
  await expect(
    toolbar.getByRole("button", { name: "Render diagram", exact: true }),
  ).toBeDisabled()

  await root.getByLabel("Diagram host endpoint").fill("/__source-only-diagram")
  await root
    .getByLabel("Diagram document ID")
    .fill("block-menu-render-document")
  const csrf = root.getByLabel("Diagram CSRF token")
  await csrf.fill("block-menu-render-token")

  const configure = root.getByRole("button", {
    name: "Configure diagram renderer",
    exact: true,
  })

  await configure.click()
  await expect(configure).toBeDisabled()
  await expect(csrf).toHaveValue("")
  expect(requests).toHaveLength(0)

  const insert = toolbar.getByRole("button", {
    name: "Insert diagram",
    exact: true,
  })

  await expect(insert).toBeEnabled()
  await insert.press("Enter")
  await expect(editor).toContainText("A[Start] --> B[Finish]")
  await expect(editor).not.toContainText("Second block")
  expect(requests).toHaveLength(0)

  const render = toolbar.getByRole("button", {
    name: "Render diagram",
    exact: true,
  })

  await expect(render).toBeEnabled()
  await render.press("Enter")
  await expect.poll(() => requests.length).toBe(1)
  expect(requests[0]?.payload).toEqual({
    version: 1,
    kind: "mermaid",
    source: "graph TD\n  A[Start] --> B[Finish]",
  })
  expect(requests[0]?.headers["x-editor-document-id"]).toBe(
    "block-menu-render-document",
  )
  expect(requests[0]?.headers["x-csrf-token"]).toBe("block-menu-render-token")
  expect(requests[0]?.headers.accept).toBe("image/svg+xml")
  await expect(
    context.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()
  await expect(toolbar).toContainText("SVG ready.")

  const downloadPromise = page.waitForEvent("download")
  await toolbar
    .getByRole("button", {
      name: "Download diagram as SVG",
      exact: true,
    })
    .click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("mermaid-diagram.svg")

  const contextAxe = await new AxeBuilder({ page })
    .include('[aria-label="Code drawing action context"]')
    .analyze()

  expect(contextAxe.violations).toEqual([])

  await context
    .getByRole("button", { name: "Close diagram tools", exact: true })
    .click()
  await expect(editor).toContainText("A[Start] --> B[Finish]")
  expect(requests).toHaveLength(1)

  await openCodeDrawing(page, editor, 1)
  await expect(
    root.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()
  expect(requests).toHaveLength(1)
  await testInfo.attach("block-menu-rendered-diagram", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("host veto, permission changes, and host replacement stop captured actions", async ({
  page,
}) => {
  let requests = 0
  await page.route("**/__source-only-diagram", async (route) => {
    requests += 1
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
    })
  })

  const root = example(page)
  const editor = await editorSurface(page)
  const menu = await openForBlock(page, editor, 1)
  await menu.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    })
  })
  await menu
    .getByRole("menuitem", { name: "Code drawing", exact: true })
    .press("Enter")
  await expect(
    root.getByRole("region", {
      name: "Code drawing action context",
      exact: true,
    }),
  ).toHaveCount(0)

  const context = await openCodeDrawing(page, editor, 1)
  await root.getByLabel("Diagram host endpoint").fill("/__source-only-diagram")
  await root.getByLabel("Diagram document ID").fill("permission-document")
  await root.getByLabel("Diagram CSRF token").fill("permission-token")
  await root
    .getByRole("button", {
      name: "Configure diagram renderer",
      exact: true,
    })
    .click()
  expect(requests).toBe(0)

  const toolbar = context.getByRole("toolbar", {
    name: "Block menu diagram controls",
    exact: true,
  })

  const insert = toolbar.getByRole("button", {
    name: "Insert diagram",
    exact: true,
  })

  const render = toolbar.getByRole("button", {
    name: "Render diagram",
    exact: true,
  })

  const diagramPermission = root.getByRole("checkbox", {
    name: "Host currently permits diagram actions",
    exact: true,
  })

  await expect(insert).toBeEnabled()
  await insert.press("Enter")
  await expect(editor).toContainText("A[Start] --> B[Finish]")
  await expect(render).toBeEnabled()

  await diagramPermission.uncheck()
  await expect(insert).toBeDisabled()
  await expect(render).toBeDisabled()
  expect(requests).toBe(0)
  await diagramPermission.check()

  await openCodeDrawing(page, editor, 1)
  await expect(insert).toBeEnabled()
  await editor.fill("Host replacement")
  await expect(insert).toBeDisabled()
  await expect(render).toBeDisabled()
  await expect(editor).toHaveText("Host replacement")
  expect(requests).toBe(0)
})

test("comment permission and read-only state prevent menu mutations", async ({
  page,
}) => {
  const root = example(page)
  const editor = await editorSurface(page)

  const comments = root.getByRole("checkbox", {
    name: "Host currently permits comments",
    exact: true,
  })

  await comments.uncheck()

  const menu = await openForBlock(page, editor, 0)
  await expect(
    menu.getByRole("menuitem", { name: "Add comment", exact: true }),
  ).toBeDisabled()
  await page.keyboard.press("Escape")
  await comments.check()

  const context = await openCodeDrawing(page, editor, 1)

  const toolbar = context.getByRole("toolbar", {
    name: "Block menu diagram controls",
    exact: true,
  })

  const before = await editor.innerHTML()
  await root
    .getByRole("button", {
      name: "Make block menu editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    toolbar.getByRole("button", { name: "Insert diagram", exact: true }),
  ).toBeDisabled()
  expect(await editor.innerHTML()).toBe(before)

  const axe = await new AxeBuilder({ page })
    .include('[aria-label="Code drawing action context"]')
    .analyze()

  expect(axe.violations).toEqual([])
})
