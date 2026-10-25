import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function example(page: Page) {
  return page.getByTestId("editor-example-public-block-menu")
}

async function editorSurface(page: Page) {
  const root = example(page)

  const toggle = root.getByRole("button", {
    name: "Live preview",
    exact: true,
  })

  if ((await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click()

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

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-block-menu")
})

test("keyboard opens native context menu, keeps selection, and returns focus on Escape @a11y", async ({
  page,
}, testInfo) => {
  const editor = await editorSurface(page)
  await editor.fill("Selected text")
  await editor.press("Home")
  await editor.press("Shift+End")

  const selected = await page.evaluate(
    () => window.getSelection()?.toString() ?? "",
  )

  expect(selected).toBe("Selected text")
  await editor.press("Shift+F10")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe(selected)

  const menuReport = await new AxeBuilder({ page })
    .include('[data-slot="context-menu-popup"]')
    .analyze()

  expect(menuReport.violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(editor).toBeFocused()
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe(selected)

  const editorReport = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-block-menu"]')
    .analyze()

  expect(editorReport.violations).toEqual([])
  await testInfo.attach("block-menu-keyboard-selection", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("pointer targets current block, copies native content, duplicates, converts, and deletes", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const editor = await editorSurface(page)
  await expect(editor.locator(":scope > *")).toHaveCount(2)

  let menu = await openForBlock(page, editor, 1)
  await menu.getByRole("menuitem", { name: "Copy block", exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("Second block")
  await expect(editor.locator(":scope > *")).toHaveCount(2)

  menu = await openForBlock(page, editor, 1)
  await menu
    .getByRole("menuitem", { name: "Duplicate block", exact: true })
    .click()
  await expect(editor.locator(":scope > *")).toHaveCount(3)
  await expect(editor.locator(":scope > *").nth(2)).toHaveText("Second block")

  menu = await openForBlock(page, editor, 0)
  await menu.getByRole("menuitem", { name: "Heading 2", exact: true }).click()
  await expect(editor.locator(":scope > h2").first()).toHaveText("First block")

  menu = await openForBlock(page, editor, 2)
  await menu
    .getByRole("menuitem", { name: "Delete block", exact: true })
    .click()
  await expect(editor.locator(":scope > *")).toHaveCount(2)
  await expect(editor.locator(":scope > h2")).toHaveText("First block")
  await expect(editor.locator(":scope > p").first()).toHaveText("Second block")

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-block-menu"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("block-menu-pointer-result", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("read-only menu disables mutations and keeps clipboard copy available", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  const root = example(page)
  await root
    .getByRole("button", {
      name: "Make block menu editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  const before = await editor.innerHTML()
  const menu = await openForBlock(page, editor, 0)
  await expect(
    menu.getByRole("menuitem", { name: "Delete block", exact: true }),
  ).toBeDisabled()
  await expect(
    menu.getByRole("menuitem", { name: "Copy block", exact: true }),
  ).toBeEnabled()
  await page.keyboard.press("Escape")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  expect(await editor.innerHTML()).toBe(before)
})

test("host context-menu cancellation prevents opening and preserves content", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  await editor.fill("Keep host content")
  await page
    .getByTestId("editor-example-public-block-menu")
    .evaluate((element) => {
      element.addEventListener(
        "contextmenu",
        (event) => event.preventDefault(),
        { capture: true, once: true },
      )
    })
  await editor.locator("p").first().click({ button: "right" })
  await expect(page.getByRole("menu")).toHaveCount(0)
  await expect(editor).toHaveText("Keep host content")
})

test("host menu-item cancellation prevents block mutation", async ({
  page,
}) => {
  const editor = await editorSurface(page)
  const menu = await openForBlock(page, editor, 0)
  await menu.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    })
  })
  await menu
    .getByRole("menuitem", { name: "Duplicate block", exact: true })
    .click()
  await expect(editor.locator(":scope > *")).toHaveCount(2)
  await expect(editor.locator(":scope > *").first()).toHaveText("First block")
})
