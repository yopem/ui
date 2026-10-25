import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

async function openExample(page: Page) {
  await page.goto("/editor/examples#public-cursors")
  const example = page.getByTestId("editor-example-public-cursors")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Public cursor overlay editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { example, editor }
}

async function dispatchNativeDrop(page: Page, target: Locator) {
  const box = await page.locator('[data-slot="editor-content"]').boundingBox()

  if (!box) throw new Error("Editor content has no layout box")

  const session = await page.context().newCDPSession(page)
  const x = box.x + Math.min(40, box.width / 2)
  const y = box.y + Math.min(20, box.height / 2)

  const data = {
    items: [{ mimeType: "text/plain", data: "Native drop payload" }],
    dragOperationsMask: 1,
  }

  await session.send("Input.dispatchDragEvent", {
    type: "dragEnter",
    x,
    y,
    data,
  })
  await session.send("Input.dispatchDragEvent", {
    type: "dragOver",
    x,
    y,
    data,
  })
  await expect(target).toBeVisible()
  await session.send("Input.dispatchDragEvent", {
    type: "drop",
    x,
    y,
    data,
  })
  await session.detach()
}

async function dispatchNativeDragOver(page: Page) {
  const box = await page.locator('[data-slot="editor-content"]').boundingBox()

  if (!box) throw new Error("Editor content has no layout box")

  const session = await page.context().newCDPSession(page)
  const x = box.x + Math.min(40, box.width / 2)
  const y = box.y + Math.min(20, box.height / 2)

  const data = {
    items: [{ mimeType: "text/plain", data: "Read-only drag payload" }],
    dragOperationsMask: 1,
  }

  await session.send("Input.dispatchDragEvent", {
    type: "dragEnter",
    x,
    y,
    data,
  })
  await session.send("Input.dispatchDragEvent", {
    type: "dragOver",
    x,
    y,
    data,
  })
  await expect(
    page.locator('[data-slot="editor-cursor-drag-caret"]'),
  ).toHaveCount(0)
  await session.send("Input.dispatchDragEvent", {
    type: "dragCancel",
    x,
    y,
    data,
  })
  await session.detach()
}

test("native drop paints caret, inserts text, and clears caret", async ({
  page,
}) => {
  const { editor } = await openExample(page)
  const caret = page.locator('[data-slot="editor-cursor-drag-caret"]')

  await dispatchNativeDrop(page, caret)

  await expect(editor).toContainText("Native drop payload")
  await expect(caret).toHaveCount(0)
})

test("selection paint follows keyboard focus and editor lifecycle", async ({
  page,
}) => {
  const { example, editor } = await openExample(page)

  const selectionPaint = page.locator(
    'body [data-slot="editor-cursor-selection"]',
  )

  const toolbarControl = example.getByRole("button", {
    name: "Focused toolbar control",
    exact: true,
  })

  const readOnlyControl = example.getByRole("button", {
    name: "Make editor read-only",
    exact: true,
  })

  await editor
    .getByText("Select this text, then move focus to the toolbar.")
    .click()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("Shift+Tab")
  await expect(toolbarControl).toBeFocused()
  await expect(selectionPaint.first()).toBeVisible()

  await readOnlyControl.click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(selectionPaint).toHaveCount(0)
  await dispatchNativeDragOver(page)

  await example.getByRole("button", { name: "Restore editing" }).click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor
    .getByText("Select this text, then move focus to the toolbar.")
    .click()
  await page.keyboard.press("ControlOrMeta+a")
  await expect(selectionPaint.first()).toBeVisible()

  await example.getByRole("button", { name: "Unmount cursor overlay" }).click()
  await expect(selectionPaint).toHaveCount(0)
  await example.getByRole("button", { name: "Mount cursor overlay" }).click()
  await expect(selectionPaint.first()).toBeVisible()
})

test("cursor example has no axe violations or narrow viewport overflow", async ({
  page,
}) => {
  const { example } = await openExample(page)

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        example.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      )
      .toBe(true)

    const report = await new AxeBuilder({ page })
      .include('[data-testid="editor-example-public-cursors"]')
      .analyze()

    expect(report.violations).toEqual([])
  }
})
