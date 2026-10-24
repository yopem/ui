import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("native block selection, keyboard reorder, history and responsive access @a11y", async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="editor-block-selection"]').first()
  const gutter = demo.getByRole("group", { name: "Block selection gutter" })
  const selects = gutter.getByRole("button", { name: /^Select block / })
  await expect(selects).toHaveCount(3)
  await selects.nth(0).click()
  await selects.nth(2).click({ modifiers: ["Shift"] })
  await expect(demo.getByRole("status")).toContainText("3 blocks selected")
  await demo.getByRole("button", { name: "Clear block selection" }).click()
  await selects.nth(1).click()
  await demo.getByRole("button", { name: "Move blocks up" }).click()
  const content = demo.locator('[data-slot="editor-content"]')
  await expect(content.locator(":scope > *").first()).toContainText("Second")
  await demo.getByRole("button", { name: "Undo" }).click()
  await expect(content.locator(":scope > *").first()).toContainText("First")
  await selects.nth(0).focus()
  await page.keyboard.press("Escape")
  await expect(demo.getByRole("status")).toContainText("0 blocks selected")
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(gutter).toBeVisible()

  const result = await new AxeBuilder({ page })
    .include('[data-slot="editor-block-selection"]')
    .analyze()

  expect(result.violations).toEqual([])
  expect(errors).toEqual([])
  await testInfo.attach("block-selection", {
    body: await page.screenshot(),
    contentType: "image/png",
  })
})

test("pointer drag and cancellation use real top-level targets", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/block-selection")
  const demo = page.locator('[data-slot="editor-block-selection"]').first()
  const handles = demo.getByRole("button", { name: /^Drag block / })
  const first = await handles.nth(0).boundingBox()
  const third = await handles.nth(2).boundingBox()
  expect(first).not.toBeNull()
  expect(third).not.toBeNull()

  if (!first || !third) throw new Error("Missing drag targets")
  await page.mouse.move(first.x + 10, first.y + 10)
  await page.mouse.down()
  await page.mouse.move(third.x + 10, third.y + third.height - 2, { steps: 10 })
  await page.mouse.up()
  await expect(
    demo.locator('[data-slot="editor-content"] > *').last(),
  ).toContainText("First")
  await handles.nth(0).focus()
  await page.keyboard.press("Escape")
  await testInfo.attach("pointer-order", {
    body: await demo.innerText(),
    contentType: "text/plain",
  })
})
