import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("readonly, native editing, stale targets, duplicate, delete and redo remain operable @a11y", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="editor-block-selection"]').first()
  const content = demo.locator('[data-slot="editor-content"]')
  const blocks = content.locator(":scope > *")
  const selects = demo.getByRole("button", { name: /^Select block / })
  await selects.nth(1).click()
  await demo.getByRole("button", { name: "Duplicate blocks" }).click()
  await expect(blocks).toHaveCount(4)
  await expect(blocks.nth(2)).toContainText("Second")
  await demo.getByRole("button", { name: "Undo" }).click()
  await expect(blocks).toHaveCount(3)
  await demo.getByRole("button", { name: "Redo" }).click()
  await expect(blocks).toHaveCount(4)
  await selects.nth(1).click()
  await demo.getByRole("button", { name: "Delete blocks" }).click()
  await expect(blocks).toHaveCount(3)
  await selects.nth(0).click()
  await demo.getByRole("button", { name: "Read only" }).click()
  await expect(demo.getByRole("status")).toContainText("0 blocks selected")
  await selects.nth(0).click()
  await expect(
    demo.getByRole("button", { name: "Delete blocks" }),
  ).toBeDisabled()
  await expect(demo.getByRole("button", { name: "Copy blocks" })).toBeEnabled()

  const scan = await new AxeBuilder({ page })
    .include('[data-slot="editor-block-selection"]')
    .analyze()

  expect(scan.violations).toEqual([])
  await demo.getByRole("button", { name: "Read only" }).click()
  await content.click()
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.type(" native text")
  await expect(demo.getByRole("status")).toContainText("0 blocks selected")
  await page.keyboard.press("ControlOrMeta+a")
  await expect(demo.getByRole("status")).toContainText("0 blocks selected")
  await testInfo.attach("native-editing", {
    body: await content.innerText(),
    contentType: "text/plain",
  })
})

test("native clipboard output and unapproved cut preserve public demo content", async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== "chromium",
    "Clipboard permissions require Chromium",
  )
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="editor-block-selection"]').first()
  const selects = demo.getByRole("button", { name: /^Select block / })
  await selects.nth(0).click()
  await selects.nth(1).click({ modifiers: ["Shift"] })
  await demo.getByRole("button", { name: "Copy blocks" }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("First")
  const before = await demo.locator('[data-slot="editor-content"]').innerText()
  await demo.getByRole("button", { name: "Cut blocks" }).click()
  await expect(demo.getByRole("status")).toContainText(
    "Host cut approval is required",
  )
  await expect(demo.locator('[data-slot="editor-content"]')).toHaveText(before)
  await testInfo.attach("clipboard-text", {
    body: await page.evaluate(() => navigator.clipboard.readText()),
    contentType: "text/plain",
  })
})

test("Escape cancels active pointer drag; RTL uses same vertical keyboard alternatives", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="editor-block-selection"]').first()
  await demo.evaluate((element) => element.setAttribute("dir", "rtl"))
  const handle = demo.getByRole("button", { name: "Drag block 1", exact: true })
  const rect = await handle.boundingBox()

  if (!rect) throw new Error("Missing pointer handle")
  const before = await demo.locator('[data-slot="editor-content"]').innerText()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
  await page.mouse.down()
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 100, { steps: 5 })
  await page.keyboard.press("Escape")
  await page.mouse.up()
  await expect(demo.locator('[data-slot="editor-content"]')).toHaveText(before)

  const select = demo.getByRole("button", {
    name: "Select block 2",
    exact: true,
  })

  await select.focus()
  await page.keyboard.press("Space")
  await page.keyboard.press("Alt+ArrowUp")
  await expect(
    demo.locator('[data-slot="editor-content"] > *').first(),
  ).toContainText("Second")
  await testInfo.attach("rtl-keyboard", {
    body: await demo.innerText(),
    contentType: "text/plain",
  })
})
