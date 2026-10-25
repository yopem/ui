import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const exampleSlug = "public-list-presentation"

function getExample(page: Page) {
  return page.getByTestId(`editor-example-${exampleSlug}`)
}

async function openExample(page: Page) {
  await page.goto(`/editor/examples#${exampleSlug}`)
  const example = getExample(page)

  const preview = example.getByRole("button", {
    name: "Live preview",
    exact: true,
  })

  if ((await preview.getAttribute("aria-expanded")) !== "true")
    await preview.click()

  const editor = example.getByRole("textbox", {
    name: "List presentation editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toContainText("Nested ordered item")

  return {
    editor,
    example,
    marker: example.getByRole("combobox", {
      name: "List marker",
      exact: true,
    }),
    start: example.getByRole("textbox", {
      name: "Ordered list start",
      exact: true,
    }),
    toolbar: example.getByRole("toolbar", {
      name: "Native list editing",
      exact: true,
    }),
  }
}

test("marker and start controls keep focus, isolate nested lists, and reject invalid drafts", async ({
  page,
}) => {
  test.slow()
  const { editor, marker, start, toolbar } = await openExample(page)
  const parent = editor.getByText("Parent item", { exact: true })

  const nested = editor
    .locator("li > ol")
    .filter({ hasText: "Nested ordered item" })

  await parent.click()
  await marker.click()
  await marker.selectOption("circle")
  await expect(marker).toBeFocused()
  await expect(
    editor.locator('ul[data-editor-list-marker="circle"]'),
  ).toHaveCount(1)
  await expect(nested).toHaveAttribute("start", "-2")

  await editor.getByText("Nested ordered item", { exact: true }).click()
  await start.click()
  await start.fill("0")
  await expect(start).toBeFocused()
  await expect(nested).toHaveAttribute("start", "0")
  await expect(
    editor.locator('ul[data-editor-list-marker="circle"]'),
  ).toHaveCount(1)

  await start.fill("2147483648")
  await expect(start).toHaveAttribute("aria-invalid", "true")

  const descriptionIsConnected = await start.evaluate((input) => {
    const description = input.getAttribute("aria-describedby")

    return Boolean(
      description && input.ownerDocument.getElementById(description),
    )
  })

  expect(descriptionIsConnected).toBe(true)
  await expect(nested).toHaveAttribute("start", "0")
  await start.fill("2147483647")
  await expect(start).toHaveAttribute("aria-invalid", "false")
  await expect(nested).toHaveAttribute("start", "2147483647")
  await start.fill("-2147483648")
  await expect(nested).toHaveAttribute("start", "-2147483648")
  await start.fill("-3")
  await expect(nested).toHaveAttribute("start", "-3")

  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(nested).toHaveAttribute("start", "-2147483648")
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(nested).toHaveAttribute("start", "-3")
})

test("native list editing preserves conversions, marker state history, and read-only behavior", async ({
  page,
}) => {
  test.slow()
  const { editor, example, marker, start, toolbar } = await openExample(page)

  await editor.getByText("Parent item", { exact: true }).click()
  await toolbar.getByRole("button", { name: "Indent", exact: true }).click()
  await expect(editor.locator("ul > li > ul > li")).toHaveCount(1)
  await editor.getByText("Parent item", { exact: true }).click()
  await toolbar.getByRole("button", { name: "Outdent", exact: true }).click()
  await expect(editor.locator("ul > li > ul > li")).toHaveCount(0)

  await editor.getByText("Parent item", { exact: true }).click()
  await marker.click()
  await marker.selectOption("square")
  await toolbar
    .getByRole("button", { name: "Numbered list", exact: true })
    .click()
  await expect(
    editor.locator("ol").filter({ hasText: "Parent item" }),
  ).toHaveCount(1)
  await expect(editor.locator("ol[data-editor-list-marker]")).toHaveCount(0)
  await expect(editor.locator("ul[data-editor-list-marker]")).toHaveCount(0)
  await expect(
    editor.locator("li > ol").filter({ hasText: "Nested ordered item" }),
  ).toHaveAttribute("start", "-2")

  await toolbar.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(
    editor.locator('ul[data-editor-list-marker="square"]'),
  ).toHaveCount(1)
  await toolbar.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("ol[data-editor-list-marker]")).toHaveCount(0)

  await editor.getByText("Parent item", { exact: true }).click()
  await toolbar.getByRole("button", { name: "Checklist", exact: true }).click()
  await expect(
    editor
      .locator('ul[__lexicallisttype="check"]')
      .filter({ hasText: "Parent item" }),
  ).toHaveCount(1)
  await expect(
    editor.locator('ul[__lexicallisttype="check"][data-editor-list-marker]'),
  ).toHaveCount(0)
  await expect(
    editor.locator("li > ol").filter({ hasText: "Nested ordered item" }),
  ).toHaveAttribute("start", "-2")

  await example
    .getByRole("button", { name: "Toggle read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(marker).toBeDisabled()
  await expect(start).toBeDisabled()
  await expect(
    toolbar.getByRole("button", { name: "Numbered list", exact: true }),
  ).toBeDisabled()
})

test("generated local JSON and HTML roundtrip strictly and rejected inputs keep content", async ({
  page,
}) => {
  test.slow()
  const { editor, example, marker, start } = await openExample(page)

  await editor.getByText("Parent item", { exact: true }).click()
  await marker.click()
  await marker.selectOption("circle")
  await editor.getByText("Ordered item", { exact: true }).click()
  await start.click()
  await start.fill("-3")

  await example
    .getByRole("button", { name: "Save local JSON", exact: true })
    .click()
  const jsonOutput = example.getByTestId("list-presentation-json-output")
  await expect(jsonOutput).toContainText('"yopemListMarker":"circle"')
  await expect(jsonOutput).toContainText('"start":-3')
  await example
    .getByRole("button", { name: "Replace document", exact: true })
    .click()
  await example
    .getByRole("button", { name: "Load local JSON", exact: true })
    .click()
  await expect(
    editor.locator('ul[data-editor-list-marker="circle"]'),
  ).toHaveCount(1)
  await expect(
    editor.locator("ol").filter({ hasText: "Ordered item" }),
  ).toHaveAttribute("start", "-3")
  await expect(
    editor.locator("li > ol").filter({ hasText: "Nested ordered item" }),
  ).toHaveAttribute("start", "-2")
  await expect(editor.locator('li[role="checkbox"]')).toHaveCount(1)

  await example
    .getByRole("button", { name: "Save local HTML", exact: true })
    .click()
  const htmlOutput = example.getByTestId("list-presentation-html-output")
  await expect(htmlOutput).toContainText('data-editor-list-marker="circle"')
  await expect(htmlOutput).toContainText('start="-3"')
  await example
    .getByRole("button", { name: "Replace document", exact: true })
    .click()
  await example
    .getByRole("button", { name: "Load local HTML", exact: true })
    .click()
  await expect(
    editor.locator('ul[data-editor-list-marker="circle"]'),
  ).toHaveCount(1)
  await expect(
    editor.locator("ol").filter({ hasText: "Ordered item" }),
  ).toHaveAttribute("start", "-3")
  await expect(
    editor.locator("li > ol").filter({ hasText: "Nested ordered item" }),
  ).toHaveAttribute("start", "-2")
  await expect(editor.locator('li[role="checkbox"]')).toHaveCount(1)

  const beforeRejectedInputs = await editor.innerHTML()
  await example
    .getByRole("button", { name: "Try invalid JSON", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  expect(await editor.innerHTML()).toBe(beforeRejectedInputs)
  await example
    .getByRole("button", { name: "Try invalid HTML", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  expect(await editor.innerHTML()).toBe(beforeRejectedInputs)
})

test("document replacement invalidates targets from focused controls and scoped shortcut", async ({
  page,
}) => {
  test.slow()
  const { editor, example, marker, start } = await openExample(page)

  await editor.getByText("Parent item", { exact: true }).click()
  await marker.click()
  await example
    .getByRole("button", { name: "Replace document", exact: true })
    .click()
  await expect(editor).toHaveText("Replacement paragraph")
  await expect(marker).toBeDisabled()
  await expect(start).toBeDisabled()

  await example
    .getByRole("button", { name: "Load initial document", exact: true })
    .click()
  await editor.getByText("Ordered item", { exact: true }).click()
  await start.click()
  await page.keyboard.press("Alt+Shift+r")
  await expect(editor).toHaveText("Replacement paragraph")
  await expect(marker).toBeDisabled()
  await expect(start).toBeDisabled()
})

test("list example stays contained at common viewport widths and has no axe violations", async ({
  page,
}, testInfo) => {
  test.slow()
  const { example } = await openExample(page)

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 960 })
    await example.scrollIntoViewIfNeeded()

    const bounds = await example.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      const documentElement = element.ownerDocument.documentElement

      return {
        left: rect.left,
        right: rect.right,
        viewportWidth: documentElement.clientWidth,
        scrollWidth: documentElement.scrollWidth,
      }
    })

    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth)
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.viewportWidth)
    await example.screenshot({
      path: testInfo.outputPath(`list-presentation-${width}.png`),
      scale: "css",
    })
  }

  const axe = await new AxeBuilder({ page })
    .include(`[data-testid="editor-example-${exampleSlug}"]`)
    .analyze()

  expect(axe.violations).toEqual([])
  await testInfo.attach("list-presentation-axe.json", {
    body: JSON.stringify(axe, null, 2),
    contentType: "application/json",
  })
})
