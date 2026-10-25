import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-floating-toolbar")
  const example = page.getByTestId("editor-example-public-floating-toolbar")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Floating toolbar editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
})

test("floating toolbar applies one-click formatting to the selected native range", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Floating toolbar editor",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")

  const toolbar = page.getByRole("toolbar", {
    name: "Text formatting",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator("strong, b")).toHaveText(
    "Select this sentence to open the floating toolbar.",
  )
  await editor.press("ControlOrMeta+z")
  await expect(editor.locator("strong, b")).toHaveCount(0)
})

test("floating toolbar supports Alt+F10, native toolbar movement, Escape, and no hidden guard focus", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Floating toolbar editor",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")

  const toolbar = page.getByRole("toolbar", {
    name: "Text formatting",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await page.keyboard.press("Alt+F10")
  await expect(
    toolbar.getByRole("button", { name: "Bold", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("ArrowRight")
  await expect(
    toolbar.getByRole("button", { name: "Italic", exact: true }),
  ).toBeFocused()
  expect(
    await page.evaluate(
      () =>
        document.activeElement !== document.body &&
        !document.activeElement?.closest('[aria-hidden="true"]'),
    ),
  ).toBe(true)
  const report = await new AxeBuilder({ page }).analyze()
  expect(report.violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(toolbar).toBeHidden()
  await expect(editor).toBeFocused()
})

test("floating toolbar invalidates collapsed and read-only targets", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Floating toolbar editor",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")

  const toolbar = page.getByRole("toolbar", {
    name: "Text formatting",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await editor.press("ArrowRight")
  await expect(toolbar).toBeHidden()
  await editor.press("ControlOrMeta+a")
  await expect(toolbar).toBeVisible()
  await page
    .getByRole("button", { name: "Make editor read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(toolbar).toBeHidden()
  const text = await editor.innerText()
  await editor.click()
  await page.keyboard.type("must not edit")
  await expect.poll(() => editor.innerText()).toBe(text)
  await page
    .getByRole("button", { name: "Enable editor editing", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.press("ControlOrMeta+a")
  await expect(toolbar).toBeVisible()
})

test("floating toolbar stays within the viewport for multiline native ranges", async ({
  page,
}, testInfo) => {
  const editor = page.getByRole("textbox", {
    name: "Floating toolbar editor",
    exact: true,
  })

  await editor.fill(
    "Select multiline text with native keyboard input. ".repeat(12),
  )

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await editor.scrollIntoViewIfNeeded()
    await editor.press("ControlOrMeta+a")

    const toolbar = page.getByRole("toolbar", {
      name: "Text formatting",
      exact: true,
    })

    await expect(toolbar).toBeVisible()
    const box = await toolbar.boundingBox()
    expect(box).not.toBeNull()

    if (!box) throw new Error("Missing floating toolbar geometry")
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    await testInfo.attach(`floating-${width}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    const report = await new AxeBuilder({ page }).analyze()
    expect(report.violations).toEqual([])
    await editor.press("ArrowRight")
  }
})

test("floating toolbar rejects a saved action after host document replacement", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Floating toolbar editor",
    exact: true,
  })

  await editor.click()
  await editor.press("ControlOrMeta+a")

  const toolbar = page.getByRole("toolbar", {
    name: "Text formatting",
    exact: true,
  })

  await expect(toolbar).toBeVisible()
  await page.keyboard.press("Alt+F10")
  await expect(
    toolbar.getByRole("button", { name: "Bold", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("Alt+Shift+R")
  await expect(toolbar).toBeHidden()
  await expect(editor).toHaveText("Host replacement paragraph.")
  await expect(editor).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(editor.locator("strong, b")).toHaveCount(0)
  await expect(editor).toContainText("Host replacement paragraph.")
})
