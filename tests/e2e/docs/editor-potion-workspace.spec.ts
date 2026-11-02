import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { z } from "zod"

const pageNames = [
  "Link",
  "Mention",
  "Playground",
  "AI",
  "Copilot",
  "Callout",
  "Equation",
  "Upload",
  "Slash Menu",
  "Block Menu",
  "Floating Toolbar",
  "Media Toolbar",
  "Table of Contents",
]

async function openWorkspace(
  page: Page,
  entry: "standalone" | "gallery" = "standalone",
) {
  await page.goto(
    entry === "gallery"
      ? "/editor/examples#notion-like"
      : "/editor/examples/notion-like",
  )

  if (entry === "gallery")
    await page
      .getByTestId("editor-example-notion-like")
      .getByRole("button", { name: "Live preview", exact: true })
      .click()

  const workspace = page.getByTestId("notion-like-workspace")

  const editor = workspace.getByRole("textbox", {
    name: "Workspace document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { workspace, editor }
}

async function navigation(page: Page, workspace: Locator) {
  const trigger = workspace.getByRole("button", {
    name: "Open workspace pages",
    exact: true,
  })

  if (await trigger.isVisible()) {
    await trigger.click()

    return page.getByRole("dialog", { name: "Workspace pages", exact: true })
  }

  return workspace.getByTestId("workspace-sidebar")
}

async function choosePage(page: Page, workspace: Locator, name: string) {
  const sidebar = await navigation(page, workspace)
  await sidebar.getByRole("button", { name, exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "Workspace pages", exact: true }),
  ).toBeHidden()
}

async function openMore(page: Page, workspace: Locator) {
  await workspace
    .getByRole("button", { name: "More page options", exact: true })
    .click()
  const menu = page.getByRole("menu", { name: "Page options", exact: true })
  await expect(menu).toBeVisible()

  return menu
}

async function copyDocument(page: Page, workspace: Locator) {
  await page.evaluate(() => navigator.clipboard.writeText(""))
  await workspace
    .getByRole("button", { name: "Copy page JSON", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .not.toBe("")
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  z.object({
    root: z.object({ type: z.literal("root"), children: z.array(z.unknown()) }),
  }).parse(JSON.parse(copied))

  return copied
}

test("AI default, ordered draft inventory, Home cards and local search", async ({
  page,
}, testInfo) => {
  const { workspace } = await openWorkspace(page)
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue("AI")
  const sidebar = await navigation(page, workspace)

  const draftPages = sidebar
    .getByRole("navigation", { name: "Workspace pages", exact: true })
    .getByRole("button")

  await expect(draftPages).toHaveCount(pageNames.length)

  for (const [index, name] of pageNames.entries()) {
    await expect(draftPages.nth(index)).toHaveAccessibleName(name)
  }

  await sidebar.getByRole("button", { name: "Home", exact: true }).click()
  await expect(
    workspace.getByRole("heading", { name: "Potion Template", exact: true }),
  ).toBeVisible()

  const recent = workspace.getByRole("region", {
    name: "Recently visited",
    exact: true,
  })

  await recent.getByRole("button", { name: "AI", exact: true }).click()
  await choosePage(page, workspace, "Callout")
  await choosePage(page, workspace, "Home")
  await expect(recent.getByRole("button")).toHaveCount(2)
  await expect(recent.getByRole("button").nth(0)).toHaveAccessibleName(
    "Callout",
  )
  await expect(recent.getByRole("button").nth(1)).toHaveAccessibleName("AI")
  await recent.getByRole("button", { name: "Callout", exact: true }).click()
  const searchSidebar = await navigation(page, workspace)
  await searchSidebar
    .getByRole("button", { name: "Search", exact: true })
    .click()

  const search = searchSidebar.getByRole("textbox", {
    name: "Search pages",
    exact: true,
  })

  await search.fill("toolbar")

  const results = searchSidebar.getByRole("navigation", {
    name: "Workspace pages",
    exact: true,
  })

  await expect(results.getByRole("button")).toHaveCount(2)
  await expect(results.getByRole("button").nth(0)).toHaveAccessibleName(
    "Floating Toolbar",
  )
  await expect(results.getByRole("button").nth(1)).toHaveAccessibleName(
    "Media Toolbar",
  )
  await search.fill("no-matching-local-page")
  await expect(results.getByRole("button")).toHaveCount(0)
  await search.fill("")
  await results.getByRole("button", { name: "Link", exact: true }).click()
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue("Link")
  await testInfo.attach("workspace-link.png", {
    body: await workspace.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})

test("native document and bounded title survive switches; history and selection reset", async ({
  page,
  context,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const title = workspace.getByRole("textbox", {
    name: "Page title",
    exact: true,
  })

  await title.fill("x".repeat(121))
  await expect(title).toHaveValue("x".repeat(120))
  await title.fill("Local AI draft")
  await expect(title).toHaveAttribute("maxlength", "120")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type(" Retained local sentence")
  await expect(editor).toContainText("Retained local sentence")
  const before = await copyDocument(page, workspace)
  await choosePage(page, workspace, "Playground")
  await expect(editor).not.toContainText("Retained local sentence")
  await choosePage(page, workspace, "Local AI draft")
  await expect(editor).toContainText("Retained local sentence")
  await expect(
    workspace.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled()
  await expect(
    workspace.getByRole("button", { name: "Redo", exact: true }),
  ).toBeDisabled()
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe("")
  expect(await copyDocument(page, workspace)).toBe(before)
  await testInfo.attach("retained-ai-document.json", {
    body: before,
    contentType: "application/json",
  })
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type(" New change")
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).not.toContainText("New change")
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor).toContainText("New change")
})

test("page presentation, cover and lock stay local without changing editor JSON @a11y", async ({
  page,
  context,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const before = await copyDocument(page, workspace)

  const initialFont = await editor.evaluate(
    (element) => getComputedStyle(element).fontFamily,
  )

  const initialSize = await editor.evaluate(
    (element) => getComputedStyle(element).fontSize,
  )

  const document = workspace.getByTestId("workspace-document")

  const initialWidth = await document.evaluate(
    (element) => getComputedStyle(element).maxWidth,
  )

  let menu = await openMore(page, workspace)
  await menu.getByRole("menuitemradio", { name: "Serif", exact: true }).click()
  await page.keyboard.press("Escape")
  await expect(editor).not.toHaveCSS("font-family", initialFont)
  menu = await openMore(page, workspace)
  await menu.getByRole("menuitemradio", { name: "Mono", exact: true }).click()
  await page.keyboard.press("Escape")
  await expect(editor).toHaveCSS("font-family", /IBM Plex Mono/)
  menu = await openMore(page, workspace)
  await menu
    .getByRole("menuitemcheckbox", { name: "Small text", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(editor).not.toHaveCSS("font-size", initialSize)
  menu = await openMore(page, workspace)
  await menu
    .getByRole("menuitemcheckbox", { name: "Full width", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(document).not.toHaveCSS("max-width", initialWidth)
  await workspace
    .getByRole("button", { name: "Add cover", exact: true })
    .click()
  await expect(workspace.getByTestId("workspace-cover")).toBeVisible()
  menu = await openMore(page, workspace)
  await menu
    .getByRole("menuitemcheckbox", { name: "Lock page", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveAttribute("readonly", "")
  await expect(
    workspace.getByRole("button", { name: "Remove cover", exact: true }),
  ).toBeDisabled()
  await editor.click()
  await page.keyboard.type("Rejected edit")
  expect(await copyDocument(page, workspace)).toBe(before)
  await choosePage(page, workspace, "Link")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveCSS("font-family", initialFont)
  await choosePage(page, workspace, "AI")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveCSS("font-family", /IBM Plex Mono/)
  menu = await openMore(page, workspace)
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("workspace-menu-whole-page-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await menu
    .getByRole("menuitemcheckbox", { name: "Lock page", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(editor).toHaveAttribute("contenteditable", "true")
})

for (const entry of ["standalone", "gallery"] as const) {
  test(`${entry}: keyboard menu dismissal, native host veto and global read-only remain usable @a11y`, async ({
    page,
  }, testInfo) => {
    const { workspace, editor } = await openWorkspace(page, entry)

    const more = workspace.getByRole("button", {
      name: "More page options",
      exact: true,
    })

    await more.focus()
    await more.press("Enter")
    const menu = page.getByRole("menu", { name: "Page options", exact: true })
    await expect(menu).toBeVisible()
    await expect(
      page
        .getByRole("main")
        .getByRole("menu", { name: "Page options", exact: true }),
    ).toBeVisible()
    await expect(
      menu.getByRole("menuitemradio", { name: "Default", exact: true }),
    ).toBeFocused()
    const menuBox = await menu.boundingBox()
    const triggerBox = await more.boundingBox()
    const viewport = page.viewportSize()

    if (!menuBox || !triggerBox || !viewport)
      throw new Error("Missing page menu geometry")

    expect(menuBox.x).toBeGreaterThanOrEqual(0)
    expect(menuBox.y).toBeGreaterThanOrEqual(0)
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width)
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height)
    expect(menuBox.x).toBeLessThan(triggerBox.x + triggerBox.width)
    expect(menuBox.x + menuBox.width).toBeGreaterThan(triggerBox.x)
    const report = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`${entry}-page-options-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await testInfo.attach(`${entry}-page-options.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(menu).toBeHidden()
    await expect(more).toBeFocused()

    const mode = workspace.getByRole("button", {
      name: "Make workspace read-only",
      exact: true,
    })

    await mode.evaluate((button) => {
      button.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      })
    })
    await mode.click()
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await mode.click()
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await choosePage(page, workspace, "Playground")
    await expect(editor).toHaveAttribute("contenteditable", "false")
    await expect(editor.getByRole("checkbox").first()).toBeDisabled()
    await workspace
      .getByRole("button", { name: "Edit workspace", exact: true })
      .click()
    await expect(editor).toHaveAttribute("contenteditable", "true")
  })
}

test("native slash, floating and block actions remain available without fixed formatting toolbar", async ({
  page,
}) => {
  const { workspace, editor } = await openWorkspace(page)
  await expect(workspace.locator('[contenteditable="true"]')).toHaveCount(1)
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type("/heading 2")
  await page
    .getByRole("listbox", { name: "Editor suggestions", exact: true })
    .getByRole("option", { name: "Heading 2", exact: true })
    .click()
  await page.keyboard.type("Local heading")
  await expect(
    editor.getByRole("heading", { name: "Local heading", exact: true }),
  ).toBeVisible()
  const paragraph = editor.locator(":scope > p").first()
  await paragraph.click()
  await editor.press("Home")
  await editor.press("Shift+End")

  const selected = await page.evaluate(
    () => window.getSelection()?.toString() ?? "",
  )

  expect(selected.length).toBeGreaterThan(0)

  const floating = page.getByRole("toolbar", {
    name: "Workspace text formatting",
    exact: true,
  })

  await expect(floating).toBeVisible()
  await page.keyboard.press("Alt+F10")
  const bold = floating.getByRole("button", { name: "Bold", exact: true })
  await expect(bold).toBeFocused()
  await bold.press("Enter")
  await expect(paragraph.locator("strong, b")).toContainText(selected)
  await page.keyboard.press("Escape")
  await expect(editor).toBeFocused()
  await paragraph.click()
  const blocks = editor.locator(":scope > *")
  const beforeDuplicate = await blocks.allInnerTexts()
  const count = await blocks.count()
  await editor.press("Shift+F10")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(
    menu.getByRole("menuitem", { name: "Ask AI", exact: true }),
  ).toHaveCount(0)
  await menu
    .getByRole("menuitem", { name: "Duplicate block", exact: true })
    .click()
  await expect(editor.locator(":scope > *")).toHaveCount(count + 1)
  await expect
    .poll(() => blocks.allInnerTexts())
    .toEqual([
      beforeDuplicate[0],
      beforeDuplicate[0],
      ...beforeDuplicate.slice(1),
    ])
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator(":scope > *")).toHaveCount(count)
  await expect.poll(() => blocks.allInnerTexts()).toEqual(beforeDuplicate)
  await workspace
    .getByRole("button", { name: "Block controls", exact: true })
    .click()

  const select = workspace.getByRole("button", {
    name: "Select block 1",
    exact: true,
  })

  await select.focus()
  await select.press("Space")
  await expect(select).toHaveAttribute("aria-pressed", "true")
  await select.press("Escape")
  await expect(select).toHaveAttribute("aria-pressed", "false")
})

test("desktop, tablet and mobile fit; whole-page accessibility and focus return @a11y", async ({
  page,
}, testInfo) => {
  const { workspace } = await openWorkspace(page)

  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await workspace.scrollIntoViewIfNeeded()
    expect(
      await workspace.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(false)
    const box = await workspace.boundingBox()

    if (!box) throw new Error("Missing workspace geometry")
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    const report = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`workspace-${width}-whole-page-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await testInfo.attach(`workspace-${width}.png`, {
      body: await workspace.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  const trigger = workspace.getByRole("button", {
    name: "Open workspace pages",
    exact: true,
  })

  await trigger.click()

  const sheet = page.getByRole("dialog", {
    name: "Workspace pages",
    exact: true,
  })

  await expect(sheet.locator(":focus")).toHaveCount(1)
  const report = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("workspace-mobile-sheet-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await testInfo.attach("workspace-mobile-sheet.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await page.keyboard.press("Escape")
  await expect(sheet).toBeHidden()
  await expect(trigger).toBeFocused()
  await choosePage(page, workspace, "Table of Contents")
  await expect(trigger).toBeFocused()
  await choosePage(page, workspace, "Home")
  await expect(
    workspace.getByRole("heading", { name: "Potion Template", exact: true }),
  ).toBeVisible()
  const homeReport = await new AxeBuilder({ page }).analyze()
  await testInfo.attach("workspace-home-whole-page-axe.json", {
    body: JSON.stringify(homeReport),
    contentType: "application/json",
  })
  expect(homeReport.violations).toEqual([])
  await testInfo.attach("workspace-home.png", {
    body: await workspace.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})
