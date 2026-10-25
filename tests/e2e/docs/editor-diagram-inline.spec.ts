import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><rect x="2" y="2" width="236" height="76" fill="#ffffff" stroke="#111111"/><text x="16" y="44" fill="#111111">Native diagram fixture</text></svg>'

test.beforeEach(async ({ page }) => {
  await page.route("**/api/editor/diagram-fixture", async (route) => {
    await route.fulfill({
      contentType: "image/svg+xml",
      body: svg,
    })
  })
  await page.goto("/editor/examples#public-code-drawing")
  const example = page.locator("#public-code-drawing")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await example
    .getByRole("textbox", { name: "Diagram host endpoint" })
    .fill("/api/editor/diagram-fixture")
  await example
    .getByRole("textbox", { name: "Diagram document ID" })
    .fill("doc-diagrams")
  await example
    .getByLabel("Diagram CSRF token", { exact: true })
    .fill("fixture-csrf")
  await example
    .getByRole("button", { name: "Configure diagram renderer", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Public code drawing editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
})

test("inline diagrams survive selection changes and retain a keyboard selection path", async ({
  page,
}, testInfo) => {
  test.slow()
  const example = page.locator("#public-code-drawing")

  const editor = example.getByRole("textbox", {
    name: "Public code drawing editor",
    exact: true,
  })

  const code = editor.locator("code").first()
  const source = code.locator('[data-slot="editor-diagram-source"]')
  await source.click()
  await example
    .getByRole("button", { name: "Render diagram", exact: true })
    .click()
  await expect(
    code.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()
  await example
    .getByRole("combobox", { name: "Diagram view", exact: true })
    .selectOption("image")
  await expect(source).toBeHidden()
  await editor
    .getByText("Diagram code stays in native Lexical code blocks.", {
      exact: true,
    })
    .click()
  await expect(
    code.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()

  const select = code.getByRole("button", {
    name: "Select mermaid diagram",
    exact: true,
  })

  await expect(select).not.toHaveAttribute("aria-current", "true")
  await select.focus()
  await page.keyboard.press("Enter")
  await expect(select).toBeFocused()
  await expect(select).toHaveAttribute("aria-current", "true")
  await expect(
    example.getByRole("button", { name: "Render diagram", exact: true }),
  ).toBeEnabled()
  await expect(
    example.getByRole("button", {
      name: "Download diagram as SVG",
      exact: true,
    }),
  ).toBeEnabled()
  await example
    .getByRole("combobox", { name: "Diagram view", exact: true })
    .selectOption("both")
  await expect(source).toBeVisible()
  await editor
    .getByText("Diagram code stays in native Lexical code blocks.", {
      exact: true,
    })
    .click()
  await example
    .getByRole("button", { name: "Insert diagram", exact: true })
    .click()
  await example
    .getByRole("button", { name: "Render diagram", exact: true })
    .click()
  await expect(
    editor.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toHaveCount(2)

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await testInfo.attach(`inline-diagrams-${width}`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("failed rendering preserves source and read-only roots block insertion", async ({
  page,
}, testInfo) => {
  test.slow()
  const example = page.locator("#public-code-drawing")

  const editor = example.getByRole("textbox", {
    name: "Public code drawing editor",
    exact: true,
  })

  const code = editor.locator("code").first()
  const source = code.locator('[data-slot="editor-diagram-source"]')
  await source.click()
  await example
    .getByRole("combobox", { name: "Diagram view", exact: true })
    .selectOption("image")
  await expect(source).toBeVisible()
  await page.route("**/api/editor/diagram-fixture", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: "{}",
    })
  })
  await example
    .getByRole("button", { name: "Render diagram", exact: true })
    .click()
  await expect(
    example
      .getByRole("status")
      .filter({ hasText: /render|diagram|request/i })
      .first(),
  ).toBeVisible()
  await expect(source).toBeVisible()
  await example
    .getByRole("button", { name: "Read-only diagram", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    example.getByRole("button", { name: "Insert diagram", exact: true }),
  ).toBeDisabled()
  await testInfo.attach("failed-diagram-source", {
    body: (await editor.textContent()) ?? "",
    contentType: "text/plain",
  })
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})
