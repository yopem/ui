import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { z } from "zod"

const nativeDocument = z.object({
  root: z.object({ type: z.literal("root"), children: z.array(z.unknown()) }),
})

async function openWorkspace(
  page: Page,
  entry: "standalone" | "gallery" = "standalone",
) {
  await page.goto(
    entry === "gallery"
      ? "/editor/examples#notion-like"
      : "/editor/examples/notion-like",
  )
  const section = page.getByTestId("editor-example-notion-like")

  if (entry === "gallery")
    await section
      .getByRole("button", { name: "Live preview", exact: true })
      .click()

  const workspace = page.getByTestId("notion-like-workspace")

  const editor = workspace.getByRole("textbox", {
    name: "Workspace document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await choosePage(page, "Playground")
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue("Playground")
  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { section, workspace, editor }
}

async function choosePage(page: Page, title: string) {
  const workspace = page.getByTestId("notion-like-workspace")

  const mobile = workspace.getByRole("button", {
    name: "Open workspace pages",
    exact: true,
  })

  if (await mobile.isVisible()) {
    await mobile.click()

    const navigation = page.getByRole("dialog", {
      name: "Workspace pages",
      exact: true,
    })

    await navigation.getByRole("button", { name: title, exact: true }).click()
    await expect(navigation).toBeHidden()
    await expect(mobile).toBeFocused()
  } else {
    await workspace
      .getByRole("navigation", { name: "Workspace pages", exact: true })
      .getByRole("button", { name: title, exact: true })
      .click()
  }
}

async function copyPageJson(workspace: Locator) {
  const page = workspace.page()
  await page.evaluate(() => navigator.clipboard.writeText(""))
  await workspace
    .getByRole("button", { name: "Copy page JSON", exact: true })
    .click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .not.toBe("")
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  nativeDocument.parse(JSON.parse(copied))

  return copied
}

test("local workspace retains page titles, native edits, tasks and copied JSON", async ({
  page,
  context,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page, "gallery")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await workspace
    .getByRole("textbox", { name: "Page title", exact: true })
    .fill("Launch brief")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type("Local launch note")
  await expect(editor).toContainText("Local launch note")
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).not.toContainText("Local launch note")
  await workspace.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor).toContainText("Local launch note")

  const cell = editor.getByRole("cell").first()
  await cell.click()
  await editor.press("End")
  await page.keyboard.type(" table edit")
  await expect(cell).toContainText("table edit")

  const task = editor.getByRole("checkbox").first()
  await task.check()
  await expect(task).toBeChecked()
  await choosePage(page, "Link")
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue("Link")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type("Meeting decision")
  await choosePage(page, "Launch brief")
  await expect(editor).toContainText("Local launch note")
  await expect(editor).not.toContainText("Meeting decision")
  await expect(editor.getByRole("checkbox").first()).toBeChecked()
  await expect(editor.getByRole("cell").first()).toContainText("table edit")
  await expect(
    workspace.getByRole("button", { name: "Undo", exact: true }),
  ).toBeDisabled()
  await workspace
    .getByRole("button", { name: "Copy page JSON", exact: true })
    .click()
  await expect(
    workspace.locator('[data-slot="clipboard-status"]'),
  ).toContainText("Copied to clipboard")
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(
    nativeDocument.parse(JSON.parse(copied)).root.children.length,
  ).toBeGreaterThan(0)
  expect(copied).toContain("Local launch note")
  await testInfo.attach("notion-like-page.json", {
    body: copied,
    contentType: "application/json",
  })
  await choosePage(page, "Link")
  await expect(editor).toContainText("Meeting decision")
})

test("slash commands and floating formatting use one native editing surface @a11y", async ({
  page,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page)
  await expect(workspace.locator('[contenteditable="true"]')).toHaveCount(1)
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type("/heading 2")

  const suggestions = page.getByRole("listbox", {
    name: "Editor suggestions",
    exact: true,
  })

  await expect(suggestions).toBeVisible()
  await suggestions
    .getByRole("option", { name: "Heading 2", exact: true })
    .click()
  await page.keyboard.type("Launch checklist")
  await expect(
    editor.getByRole("heading", { name: "Launch checklist", exact: true }),
  ).toBeVisible()
  await editor.press("Enter")
  await page.keyboard.type("/callout")
  await suggestions
    .getByRole("option", { name: "Callout", exact: true })
    .click()
  await page.keyboard.type("A local callout")
  await expect(
    editor
      .locator("[data-editor-callout]")
      .filter({ hasText: "A local callout" }),
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

  const floatingReport = await new AxeBuilder({ page }).analyze()

  await testInfo.attach("notion-like-floating-axe.json", {
    body: JSON.stringify(floatingReport),
    contentType: "application/json",
  })
  expect(floatingReport.violations).toEqual([])
  await page.keyboard.press("Alt+F10")
  const bold = floating.getByRole("button", { name: "Bold", exact: true })
  await expect(bold).toBeFocused()
  await bold.press("Enter")
  await expect(paragraph.locator("strong, b")).toContainText(selected)
  await page.keyboard.press("Escape")
  await expect(floating).toBeHidden()
  await expect(editor).toBeFocused()

  await editor.press("ControlOrMeta+End")
  await editor.press("Enter")
  await page.keyboard.type("/")
  await expect(suggestions).toBeVisible()

  const report = await new AxeBuilder({ page }).analyze()

  await testInfo.attach("notion-like-suggestions-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
  await editor.press("Escape")
  await expect(suggestions).toBeHidden()
})

test("block controls move native blocks and context actions duplicate with undo @a11y", async ({
  page,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page)
  await workspace
    .getByRole("button", { name: "Block controls", exact: true })
    .click()
  const blocks = editor.locator(":scope > *")
  const first = await blocks.first().innerText()
  const originalOrder = await blocks.allInnerTexts()

  const movedOrder = [
    originalOrder[1],
    originalOrder[0],
    ...originalOrder.slice(2),
  ]

  const undo = workspace.getByRole("button", { name: "Undo", exact: true })
  const redo = workspace.getByRole("button", { name: "Redo", exact: true })
  const selection = workspace.locator('[data-slot="editor-block-selection"]')
  const status = selection.getByRole("status")

  async function recordBlockState(name: string) {
    await testInfo.attach(`notion-like-${name}.json`, {
      body: JSON.stringify({
        order: await blocks.allInnerTexts(),
        status: await status.innerText(),
        history: {
          undoEnabled: await undo.isEnabled(),
          redoEnabled: await redo.isEnabled(),
        },
        markers: await blocks.evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).boxShadow),
        ),
      }),
      contentType: "application/json",
    })
  }

  async function dragFirstBlock(edge: "before" | "after", cancel = false) {
    const name = `drag-${edge}${cancel ? "-cancel" : ""}`

    const handle = workspace.getByRole("button", {
      name: "Drag block 1",
      exact: true,
    })

    const target = blocks.nth(1)
    await target.scrollIntoViewIfNeeded()
    await handle.hover()
    const sourceRect = await blocks.first().boundingBox()
    const targetRect = await target.boundingBox()
    const handleRect = await handle.boundingBox()

    const targetHandleRect = await workspace
      .getByRole("button", { name: "Drag block 2", exact: true })
      .boundingBox()

    if (!sourceRect || !targetRect || !handleRect || !targetHandleRect)
      throw new Error("Missing native block drag geometry")

    const start = {
      x: handleRect.x + handleRect.width / 2,
      y: handleRect.y + handleRect.height / 2,
    }

    const end = {
      x: targetRect.x + targetRect.width / 2,
      y: targetRect.y + targetRect.height * (edge === "before" ? 0.25 : 0.75),
    }

    const markerBefore = await target.evaluate(
      (element) => getComputedStyle(element).boxShadow,
    )

    await testInfo.attach(`notion-like-${name}-geometry.json`, {
      body: JSON.stringify({
        project: testInfo.project.name,
        viewport: page.viewportSize(),
        sourceRect,
        targetRect,
        handleRect,
        targetHandleRect,
        start,
        end,
        edge,
        markerBefore,
      }),
      contentType: "application/json",
    })
    await recordBlockState(`${name}-before`)
    await page.mouse.move(start.x, start.y)
    await page.mouse.down()

    try {
      await page.mouse.move(end.x, end.y, { steps: 12 })

      try {
        await expect(target).toHaveCSS(
          "box-shadow",
          edge === "before"
            ? / 0px -[1-9]\d*(?:\.\d+)?px /
            : / 0px [1-9]\d*(?:\.\d+)?px /,
        )
      } finally {
        await recordBlockState(`${name}-held`)
      }

      if (cancel) {
        await page.keyboard.press("Escape")
        await expect(target).toHaveCSS("box-shadow", markerBefore)
      }
    } finally {
      await page.mouse.up()
      await recordBlockState(`${name}-released`)
    }
  }

  await workspace
    .getByRole("button", { name: "Select block 1", exact: true })
    .click()
  await expect(
    workspace.getByRole("button", { name: "Select block 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await workspace
    .getByRole("button", { name: "Move blocks down", exact: true })
    .click()
  await expect(editor.locator(":scope > *").nth(1)).toHaveText(first)
  await workspace.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor.locator(":scope > *").first()).toHaveText(first)
  await expect.poll(() => blocks.allInnerTexts()).toEqual(originalOrder)
  await expect(undo).toBeDisabled()
  await expect(redo).toBeEnabled()

  await test.step("before immediate next block preserves order and history", async () => {
    await dragFirstBlock("before")
    await expect(status).toContainText("Blocks are already at this position")
    await expect.poll(() => blocks.allInnerTexts()).toEqual(originalOrder)
    await expect(undo).toBeDisabled()
    await expect(redo).toBeEnabled()
  })

  await test.step("after actual block midpoint moves once and native Undo restores", async () => {
    await dragFirstBlock("after")
    await expect(editor.locator(":scope > *").nth(1)).toHaveText(first)
    await expect.poll(() => blocks.allInnerTexts()).toEqual(movedOrder)
    await expect(undo).toBeEnabled()
    await expect(redo).toBeDisabled()
    await workspace.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(editor.locator(":scope > *").first()).toHaveText(first)
    await expect.poll(() => blocks.allInnerTexts()).toEqual(originalOrder)
    await expect(undo).toBeDisabled()
    await expect(redo).toBeEnabled()
    await recordBlockState("drag-after-undo")
  })

  await dragFirstBlock("after", true)
  await expect.poll(() => blocks.allInnerTexts()).toEqual(originalOrder)
  await expect(undo).toBeDisabled()
  await expect(redo).toBeEnabled()

  const select = workspace.getByRole("button", {
    name: "Select block 1",
    exact: true,
  })

  await select.focus()
  await select.press("Space")
  await select.press("Alt+ArrowDown")
  await expect.poll(() => blocks.allInnerTexts()).toEqual(movedOrder)
  await undo.click()
  await expect.poll(() => blocks.allInnerTexts()).toEqual(originalOrder)
  await expect(undo).toBeDisabled()
  await select.focus()
  await select.press("Escape")
  await expect(select).toHaveAttribute("aria-pressed", "false")
  await recordBlockState("keyboard-move-undo-cancel")
  await workspace
    .getByRole("button", { name: "Block controls", exact: true })
    .click()

  await editor.locator(":scope > p").first().click()
  const count = await blocks.count()
  const beforeDuplicate = await blocks.allInnerTexts()
  await expect.poll(() => blocks.allInnerTexts()).toEqual(originalOrder)
  await editor.press("Shift+F10")
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(
    menu.getByRole("menuitem", { name: "Ask AI", exact: true }),
  ).toHaveCount(0)

  const report = await new AxeBuilder({ page }).analyze()

  await testInfo.attach("notion-like-block-menu-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
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
  await editor.locator(":scope > p").first().click({ button: "right" })
  await expect(menu).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(editor).toBeFocused()
})

test("read-only protects document, title, tasks and native mutation controls @a11y", async ({
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

  const before = await editor.innerText()
  const beforeNative = await copyPageJson(workspace)
  await testInfo.attach("notion-like-readonly-before.json", {
    body: beforeNative,
    contentType: "application/json",
  })
  await workspace
    .getByRole("button", { name: "Make workspace read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(title).toHaveAttribute("readonly", "")
  await expect(editor.getByRole("checkbox").first()).toBeDisabled()

  const readonlyReport = await new AxeBuilder({ page }).analyze()

  await testInfo.attach("notion-like-readonly-axe.json", {
    body: JSON.stringify(readonlyReport),
    contentType: "application/json",
  })
  expect(readonlyReport.violations).toEqual([])
  await editor.click()
  await page.keyboard.type("Must not change")
  const after = await editor.innerText()
  const afterNative = await copyPageJson(workspace)
  await testInfo.attach("notion-like-readonly-after.json", {
    body: afterNative,
    contentType: "application/json",
  })
  await testInfo.attach("notion-like-readonly-text.json", {
    body: JSON.stringify({ before, after }),
    contentType: "application/json",
  })
  await expect(editor).toHaveText(before, { useInnerText: true })
  expect(after).toBe(before)
  expect(afterNative).toBe(beforeNative)
  await workspace
    .getByRole("button", { name: "Block controls", exact: true })
    .click()
  await workspace
    .getByRole("button", { name: "Select block 1", exact: true })
    .click()
  await expect(
    workspace.getByRole("button", { name: "Delete blocks", exact: true }),
  ).toBeDisabled()
  await expect(
    workspace.getByRole("button", { name: "Move blocks down", exact: true }),
  ).toBeDisabled()
  await expect(
    workspace.getByRole("button", { name: "Drag block 1", exact: true }),
  ).toBeDisabled()
  await editor.locator(":scope > p").first().click({ button: "right" })
  const menu = page.getByRole("menu")
  await expect(menu).toBeVisible()
  await expect(
    menu.getByRole("menuitem", { name: "Duplicate block", exact: true }),
  ).toHaveAttribute("aria-disabled", "true")
  await page.keyboard.press("Escape")
  await expect(menu).toBeHidden()
  await expect(editor).toBeFocused()
  expect(await editor.innerText()).toBe(before)
  expect(await copyPageJson(workspace)).toBe(beforeNative)
  await choosePage(page, "Callout")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    workspace.getByRole("button", { name: "Copy page JSON", exact: true }),
  ).toBeEnabled()
  await workspace
    .getByRole("button", { name: "Edit workspace", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(title).not.toHaveAttribute("readonly")
})

test("workspace mode respects native host cancellation", async ({
  page,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page)

  const mode = workspace.getByRole("button", {
    name: "Make workspace read-only",
    exact: true,
  })

  await mode.evaluate((button) => {
    button.addEventListener(
      "click",
      (event) => {
        button.setAttribute("data-host-cancelled", String(event.isTrusted))
        event.preventDefault()
      },
      { capture: true, once: true },
    )
  })
  await mode.click()
  await expect(mode).toHaveAttribute("data-host-cancelled", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).not.toHaveAttribute("readonly")
  await mode.click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await testInfo.attach("notion-mode-host-cancellation.json", {
    body: JSON.stringify({
      trustedCancelledClick: true,
      editableAfterCancellation: true,
      editableAfterNextClick: false,
    }),
    contentType: "application/json",
  })
})

test("workspace setup copies supported single-item commands for every package manager", async ({
  page,
  context,
  request,
}, testInfo) => {
  const { section } = await openWorkspace(page, "gallery")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const response = await request.get("/api/editor-examples.json")
  expect(response.ok()).toBe(true)

  const inventory = z
    .object({
      examples: z.array(
        z.object({
          slug: z.string(),
          installNames: z.array(z.string()).min(1),
        }),
      ),
    })
    .parse(await response.json())

  const example = inventory.examples.find(
    (entry) => entry.slug === "notion-like",
  )

  if (!example) throw new Error("Missing notion-like example")
  await section
    .getByRole("button", { name: "Limits and setup", exact: true })
    .click()

  const setup = section.getByRole("region", {
    name: "Notion-like local workspace limits and installation",
    exact: true,
  })

  await expect(setup).toBeVisible()
  const commands: { manager: string; commands: string[] }[] = []

  for (const [manager, prefix] of [
    ["Bun", "bunx --bun"],
    ["npm", "npx"],
    ["pnpm", "pnpm dlx"],
    ["Yarn", "yarn dlx"],
  ] as const) {
    await setup.getByRole("button", { name: manager, exact: true }).click()
    await setup
      .getByRole("button", {
        name: /^(Copy Install registry items|Install registry items copied)$/,
      })
      .click()

    const expected = example.installNames.map(
      (item) => `${prefix} @yopem-ui/cli add ${item}`,
    )

    await expect
      .poll(async () =>
        (await page.evaluate(() => navigator.clipboard.readText()))
          .trim()
          .split("\n"),
      )
      .toEqual(expected)
    commands.push({ manager, commands: expected })
  }

  await testInfo.attach("workspace-install-commands.json", {
    body: JSON.stringify(commands, null, 2),
    contentType: "application/json",
  })
})

test("workspace source copy exposes consumer imports", async ({
  page,
  context,
}, testInfo) => {
  const { section } = await openWorkspace(page, "gallery")
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await section
    .getByRole("button", { name: "Copy source", exact: true })
    .click()
  await expect(
    section
      .locator('[data-slot="clipboard-status"]')
      .filter({ hasText: "Copied to clipboard" }),
  ).toHaveCount(1)
  const source = await page.evaluate(() => navigator.clipboard.readText())
  expect(source).toContain("NotionLikeExample")
  expect(source).toContain("@/components/editor/block-menu-index")
  expect(source).not.toContain("@registry/")
  expect(source).not.toContain("@yopem-ui/editor")
  await testInfo.attach("notion-like-consumer.tsx", {
    body: source,
    contentType: "text/plain",
  })
})

test("workspace fits desktop, tablet and mobile; Sheet navigation restores focus @a11y", async ({
  page,
}, testInfo) => {
  const { workspace, editor } = await openWorkspace(page)

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await workspace.scrollIntoViewIfNeeded()
    const box = await workspace.boundingBox()
    expect(box).not.toBeNull()

    if (!box) throw new Error("Missing workspace geometry")
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)

    const overflow = await workspace.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    )

    expect(overflow).toBe(false)

    const report = await new AxeBuilder({ page }).analyze()

    await testInfo.attach(`notion-like-${width}-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await testInfo.attach(`notion-like-${width}.png`, {
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

  await expect(sheet).toBeVisible()
  await expect(sheet.locator(":focus")).toHaveCount(1)

  const sheetReport = await new AxeBuilder({ page }).analyze()

  await testInfo.attach("notion-like-sheet-axe.json", {
    body: JSON.stringify(sheetReport),
    contentType: "application/json",
  })
  expect(sheetReport.violations).toEqual([])
  await testInfo.attach("notion-like-mobile-pages.png", {
    body: await page.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await page.keyboard.press("Escape")
  await expect(sheet).toBeHidden()
  await expect(trigger).toBeFocused()
  await choosePage(page, "Link")
  await expect(
    workspace.getByRole("textbox", { name: "Page title", exact: true }),
  ).toHaveValue("Link")
  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type("Mobile note")
  await expect(editor).toContainText("Mobile note")
})
