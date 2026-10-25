import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#search")
  const example = page.getByTestId("editor-example-search")
  await expect(example).toBeVisible()
  await example.getByRole("button", { name: "Live preview" }).click()
  await expect(example.getByRole("textbox")).toHaveAttribute(
    "contenteditable",
    "true",
  )
})

test("search: highlights live without changing editor content", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-search")
  const editor = example.getByRole("textbox")
  const input = example.getByRole("searchbox", { name: "Search editor" })
  const beforeText = await editor.innerText()
  const beforeHtml = await editor.innerHTML()

  await input.fill("text")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(2)
  await expect(example.getByRole("status")).toHaveText("1 of 2")
  expect(await editor.innerText()).toBe(beforeText)
  expect(await editor.innerHTML()).toBe(beforeHtml)

  await input.fill("missing")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(0)
  await expect(example.getByRole("status")).toHaveText("0 of 0")

  await input.fill("")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(0)
})

test("search overlays recover after a preview unmounts", async ({ page }) => {
  const example = page.getByTestId("editor-example-search")
  const input = example.getByRole("searchbox", { name: "Search editor" })

  await input.fill("text")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(2)

  await example.getByRole("button", { name: "Live preview" }).click()
  await expect(input).toBeHidden()
  await example.getByRole("button", { name: "Live preview" }).click()

  const reopenedInput = example.getByRole("searchbox", {
    name: "Search editor",
  })

  await expect(reopenedInput).toBeVisible()
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(2)
})

test("search: next and previous select matches with keyboard and pointer", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-search")
  const editor = example.getByRole("textbox")
  const input = example.getByRole("searchbox", { name: "Search editor" })
  const status = example.getByRole("status")

  await input.fill("text")
  await input.press("Enter")
  await expect(editor).toBeFocused()
  await expect(status).toHaveText("2 of 2")
  expect(await page.evaluate(() => document.getSelection()?.toString())).toBe(
    "text",
  )

  await input.focus()
  await input.press("Shift+Enter")
  await expect(editor).toBeFocused()
  await expect(status).toHaveText("1 of 2")

  await example.getByRole("button", { name: "Next match" }).click()
  await expect(editor).toBeFocused()
  await expect(status).toHaveText("2 of 2")
  await expect(example.getByRole("button", { name: /replace/i })).toHaveCount(0)
})

test("search navigation does not create an undo step", async ({ page }) => {
  const example = page.getByTestId("editor-example-search")
  const editor = example.getByRole("textbox")
  const input = example.getByRole("searchbox", { name: "Search editor" })
  const beforeText = await editor.innerText()

  await editor.press("Control+End")
  await editor.type("!")
  await expect.poll(() => editor.innerText()).toBe(`${beforeText}!`)

  await input.fill("missing")
  await input.fill("text")
  await input.press("Enter")
  await expect(editor).toBeFocused()
  await expect.poll(() => editor.innerText()).toBe(`${beforeText}!`)

  await editor.press("Control+z")
  await expect.poll(() => editor.innerText()).toBe(beforeText)
})

test("search navigation works in a read-only editor", async ({ page }) => {
  await page.goto("/editor/search-root")

  const editor = page.getByRole("textbox", { name: "Search editor" })
  const input = page.getByRole("searchbox", { name: "Search editor" })
  const beforeText = await editor.innerText()

  await expect(editor).toHaveAttribute("aria-readonly", "true")
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await input.fill("text")
  await input.press("Enter")

  await expect(editor).toBeFocused()
  await expect(page.getByRole("status")).toHaveText("2 of 2")
  expect(await editor.innerText()).toBe(beforeText)

  await input.focus()
  await page.getByRole("button", { name: "Next match" }).click()
  await expect(editor).toBeFocused()
  await expect(page.getByRole("status")).toHaveText("1 of 2")
})

test("search: rescans edited text and keeps its controls accessible @a11y", async ({
  page,
}) => {
  const example = page.getByTestId("editor-example-search")
  const editor = example.getByRole("textbox")
  const input = example.getByRole("searchbox", { name: "Search editor" })

  await input.fill("text")
  await editor.fill("text text")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(2)
  await editor.fill("")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(0)

  const results = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-search"]')
    .analyze()

  expect(results.violations).toEqual([])
})

test("search range overlays remain contained at desktop and phone widths", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("editor-example-search")
  const editor = example.getByRole("textbox")
  const input = example.getByRole("searchbox", { name: "Search editor" })
  await editor.fill("searchable text ".repeat(100))
  await input.fill("text")
  await expect(
    example.locator('[data-slot="editor-search-highlight"]'),
  ).toHaveCount(100)

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await input.scrollIntoViewIfNeeded()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await expect(
      example.locator('[data-slot="editor-search-highlight"]'),
    ).toHaveCount(100)
    await testInfo.attach(`search-${width}.png`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  const report = await new AxeBuilder({ page })
    .include('[data-testid="editor-example-search"]')
    .analyze()

  expect(report.violations).toEqual([])
})
