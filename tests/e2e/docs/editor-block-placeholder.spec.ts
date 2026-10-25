import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-placeholder")
  await page
    .getByTestId("editor-example-public-placeholder")
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    page.getByRole("textbox", { name: "Per-block placeholders", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

test("only a focused empty root block exposes its placeholder without adding document content", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Per-block placeholders",
    exact: true,
  })

  const json = page.getByRole("region", { name: "Placeholder document JSON" })
  const before = await json.innerText()
  const heading = editor.locator("h2")
  await heading.click()
  await expect(heading).toHaveAttribute(
    "data-editor-block-placeholder",
    "Write a section title",
  )
  await expect(editor.locator("[data-editor-block-placeholder]")).toHaveCount(1)
  await expect(
    page.getByRole("status", { name: "Selected block placeholder" }),
  ).toHaveText("Write a section title")
  await expect(json).toHaveText(before)
  expect(await editor.textContent()).not.toContain("Write a section title")
  await page.keyboard.type("Real title")
  await expect(heading).not.toHaveAttribute("data-editor-block-placeholder")
  await expect(heading).toHaveText("Real title")
  await editor.press("ControlOrMeta+z")
  await expect(heading).toHaveAttribute(
    "data-editor-block-placeholder",
    "Write a section title",
  )
  const paragraph = editor.locator("p").last()
  await paragraph.click()
  await expect(paragraph).toHaveAttribute(
    "data-editor-block-placeholder",
    "Write a paragraph",
  )
  await expect(heading).not.toHaveAttribute("data-editor-block-placeholder")
})

test("blur, readonly and layer removal clear owned placeholders without changing JSON", async ({
  page,
}) => {
  const editor = page.getByRole("textbox", {
    name: "Per-block placeholders",
    exact: true,
  })

  const heading = editor.locator("h2")
  await heading.click()
  await expect(heading).toHaveAttribute("data-editor-block-placeholder")
  const json = page.getByRole("region", { name: "Placeholder document JSON" })
  const before = await json.innerText()
  await editor.press("Alt+Shift+p")
  await expect(editor.locator("[data-editor-block-placeholder]")).toHaveCount(0)
  await expect(json).toHaveText(before)
  await editor.press("Alt+Shift+p")
  await expect(heading).toHaveAttribute("data-editor-block-placeholder")
  await page
    .getByRole("button", {
      name: "Make placeholder editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await heading.click()
  await expect(editor.locator("[data-editor-block-placeholder]")).toHaveCount(0)
  await expect(json).toHaveText(before)
})

test("selected placeholders wrap within desktop and mobile layouts and expose accessible status", async ({
  page,
}, testInfo) => {
  const editor = page.getByRole("textbox", {
    name: "Per-block placeholders",
    exact: true,
  })

  const example = page.getByTestId("editor-example-public-placeholder")

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await editor.locator("h2").click()
    await expect(editor.locator("h2")).toHaveAttribute(
      "data-editor-block-placeholder",
    )
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="editor-example-public-placeholder"]')
          .analyze()
      ).violations,
    ).toEqual([])
    await testInfo.attach(`block-placeholder-${width}.png`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }
})
