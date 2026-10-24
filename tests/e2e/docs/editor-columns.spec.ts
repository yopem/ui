import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.use({ permissions: ["clipboard-read", "clipboard-write"] })

test("native columns support rich editing, resize, move, clipboard and history", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/columns-controls")

  const content = page.getByRole("textbox", {
    name: "Columns editor",
    exact: true,
  })

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await content.fill("Before columns")
  await page
    .getByRole("button", { name: "Insert 2 columns", exact: true })
    .click()

  const group = content.locator('[data-editor-columns="1"]')
  const columns = group.locator('[data-editor-column="1"]')
  await expect(group).toHaveAttribute("data-editor-columns-layout", "50,50")
  await expect(group.locator("[data-editor-column-editable]")).toHaveCount(2)
  await columns.nth(0).click()
  await page.keyboard.type("Left content")
  await columns.nth(1).click()
  await page.keyboard.type("Right content")
  await expect(columns.nth(0)).toContainText("Left content")
  await expect(columns.nth(1)).toContainText("Right content")

  const slider = page.getByRole("slider", {
    name: "Resize between column 1 and column 2",
  })

  await slider.focus()
  await page.keyboard.press("ArrowRight")
  const keyboardLayout = await group.getAttribute("data-editor-columns-layout")
  await expect(group).not.toHaveAttribute("data-editor-columns-layout", "50,50")

  const box = await slider.boundingBox()

  if (!box) throw new Error("Column resize slider is not visible")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2, {
    steps: 5,
  })
  await page.mouse.up()
  const pointerLayout = await group.getAttribute("data-editor-columns-layout")
  await expect(group).not.toHaveAttribute(
    "data-editor-columns-layout",
    keyboardLayout ?? "",
  )

  await columns.nth(1).click()
  await page
    .getByRole("button", { name: "Move column left", exact: true })
    .click()
  await expect(columns.nth(0)).toContainText("Right content")
  await expect(columns.nth(1)).toContainText("Left content")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

  await content.click()
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("ControlOrMeta+c")
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.press("ControlOrMeta+v")
  await expect(content.locator('[data-editor-columns="1"]')).toHaveCount(2)
  await page.keyboard.press("ControlOrMeta+a")
  await page.keyboard.press("ControlOrMeta+x")
  await expect(content.locator('[data-editor-columns="1"]')).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(content.locator('[data-editor-columns="1"]')).toHaveCount(2)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(content.locator('[data-editor-columns="1"]')).toHaveCount(1)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(group).toHaveAttribute(
    "data-editor-columns-layout",
    pointerLayout ?? "",
  )

  await page
    .getByRole("button", { name: "Remove columns", exact: true })
    .click()
  await expect(content.locator('[data-editor-columns="1"]')).toHaveCount(0)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(content.locator('[data-editor-columns="1"]')).toHaveCount(1)

  await page
    .getByRole("button", { name: "Toggle read-only", exact: true })
    .click()
  await expect(content).toHaveAttribute("aria-readonly", "true")
  await expect(group.locator("[data-editor-column-editable]")).toHaveCount(0)
  await expect(
    page.getByRole("slider", {
      name: "Resize between column 1 and column 2",
    }),
  ).toBeDisabled()

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme })
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    )

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 768, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport)

      const overflows = await group.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth ||
          element.getBoundingClientRect().right >
            document.documentElement.clientWidth,
      )

      expect(overflows).toBe(false)
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    }
  }

  await page.emulateMedia({ colorScheme: "light" })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.screenshot({
    path: testInfo.outputPath("editor-columns-workflow.png"),
    scale: "css",
  })
  await testInfo.attach("editor-columns-result", {
    body: Buffer.from(
      JSON.stringify({
        layout: await group.getAttribute("data-editor-columns-layout"),
        readOnly: await content.getAttribute("aria-readonly"),
      }),
    ),
    contentType: "application/json",
  })
})
