import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function openExample(page: Page) {
  test.slow()
  await page.goto("/editor/examples#public-selection")
  const root = page.getByTestId("editor-example-public-selection")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()

  const editor = root.getByRole("textbox", {
    name: "Public block selection editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { root, editor }
}

test("block selection: range, clipboard authorization, rich cut, history, and read-only", async ({
  page,
  context,
}, testInfo) => {
  const { root, editor } = await openExample(page)
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  const paragraphs = editor.locator(":scope > p")
  await root
    .getByRole("button", { name: "Select block 1", exact: true })
    .click()
  await root
    .getByRole("button", { name: "Select block 3", exact: true })
    .click({ modifiers: ["Shift"] })

  for (const index of [1, 2, 3])
    await expect(
      root.getByRole("button", { name: `Select block ${index}`, exact: true }),
    ).toHaveAttribute("aria-pressed", "true")
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  page.once("dialog", async (dialog) => {
    await dialog.dismiss()
  })
  await page.keyboard.press("ControlOrMeta+x")
  await expect(paragraphs).toHaveCount(3)
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Clipboard sentinel",
  )
  page.once("dialog", async (dialog) => {
    await dialog.accept()
  })
  await page.keyboard.press("ControlOrMeta+x")
  await expect(editor).not.toContainText("First block")
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("Third block")
  await root.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(paragraphs).toHaveText([
    "First block",
    "Second block",
    "Third block",
  ])
  await expect(paragraphs.first().locator("strong, b")).toHaveText(
    "First block",
  )
  await root
    .getByRole("button", { name: "Read-only selection", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await root
    .getByRole("button", { name: "Select block 1", exact: true })
    .click()
  await expect(
    root.getByRole("button", { name: "Delete blocks", exact: true }),
  ).toBeDisabled()
  await expect(
    root.getByRole("button", { name: "Move blocks down", exact: true }),
  ).toBeDisabled()

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-selection"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("public-selection-after-undo.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})

test("dnd: pointer reorder and single-pointer move controls preserve one-step history", async ({
  page,
}, testInfo) => {
  const { root, editor } = await openExample(page)
  const paragraphs = editor.locator(":scope > p")
  const first = root.getByRole("button", { name: "Drag block 1", exact: true })
  const last = root.getByRole("button", { name: "Drag block 3", exact: true })
  await first.dragTo(last)
  await expect(paragraphs).toHaveText([
    "Second block",
    "Third block",
    "First block",
  ])
  await root.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(paragraphs).toHaveText([
    "First block",
    "Second block",
    "Third block",
  ])
  await root
    .getByRole("button", { name: "Select block 1", exact: true })
    .click()
  await root
    .getByRole("button", { name: "Move blocks down", exact: true })
    .click()
  await expect(paragraphs).toHaveText([
    "Second block",
    "First block",
    "Third block",
  ])
  await root.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(paragraphs).toHaveText([
    "First block",
    "Second block",
    "Third block",
  ])

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-public-selection"]')
    .analyze()

  expect(report.violations).toEqual([])
  await testInfo.attach("public-block-reorder.html", {
    body: await editor.innerHTML(),
    contentType: "text/html",
  })
})
