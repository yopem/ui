import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><rect x="2" y="2" width="236" height="76" fill="#ffffff" stroke="#111111"/><text x="16" y="44" fill="#111111">Saved diagram</text></svg>'

test("mounting read-only starts saved-diagram rendering without a selection", async ({
  page,
}) => {
  test.slow()
  const requests: string[] = []

  await page.route("**/api/editor/diagram-fixture", async (route) => {
    requests.push(route.request().postData() ?? "")
    await route.fulfill({ contentType: "image/svg+xml", body: svg })
  })
  await page.goto("/editor/examples#public-code-drawing")
  const example = page.locator("#public-code-drawing")

  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await example
    .getByRole("button", { name: "Read-only diagram", exact: true })
    .click()
  await example
    .getByRole("textbox", { name: "Diagram host endpoint", exact: true })
    .fill("/api/editor/diagram-fixture")
  await example
    .getByRole("textbox", { name: "Diagram document ID", exact: true })
    .fill("doc-readonly-diagram")
  await example
    .getByLabel("Diagram CSRF token", { exact: true })
    .fill("fixture-csrf")
  await example
    .getByRole("button", { name: "Configure diagram renderer", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Public code drawing editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect.poll(() => requests.length).toBe(1)
  await expect(
    editor.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()
  await expect(
    example.getByRole("button", { name: "Insert diagram", exact: true }),
  ).toBeDisabled()

  const accessibility = await new AxeBuilder({ page })
    .include("#public-code-drawing")
    .analyze()

  expect(accessibility.violations).toEqual([])
})

test("opt-in rendering previews saved unselected diagrams in read-only mode", async ({
  page,
}) => {
  const requests: string[] = []
  const responses: (() => void)[] = []

  await page.route("**/api/editor/diagram-fixture", async (route) => {
    requests.push(route.request().postData() ?? "")
    await new Promise<void>((resolve) => responses.push(resolve))
    await route.fulfill({ contentType: "image/svg+xml", body: svg })
  })
  await page.goto("/editor/examples#public-code-drawing")
  const example = page.locator("#public-code-drawing")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await example
    .getByRole("textbox", { name: "Diagram host endpoint", exact: true })
    .fill("/api/editor/diagram-fixture")
  await example
    .getByRole("textbox", { name: "Diagram document ID", exact: true })
    .fill("doc-diagrams")
  await example
    .getByLabel("Diagram CSRF token", { exact: true })
    .fill("fixture-csrf")
  await example
    .getByRole("button", { name: "Configure diagram renderer", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Public code drawing editor",
    exact: true,
  })

  const first = editor.locator("code").first()
  const firstSource = first.locator('[data-slot="editor-diagram-source"]')

  const viewMode = example.getByRole("combobox", {
    name: "Diagram view",
    exact: true,
  })

  await expect.poll(() => requests.length).toBe(1)
  await firstSource.click()
  await viewMode.selectOption("image")
  await expect(firstSource).toBeVisible()
  await example
    .getByRole("button", { name: "Insert diagram", exact: true })
    .click()

  const second = editor.locator("code").nth(1)
  const secondSource = second.locator('[data-slot="editor-diagram-source"]')

  await expect.poll(() => requests.length).toBe(2)
  await viewMode.selectOption("image")
  await expect(secondSource).toBeVisible()
  await example
    .getByRole("button", { name: "Read-only diagram", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")

  for (const release of responses) release()

  await expect(
    first.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()
  await expect(
    second.getByRole("img", { name: "mermaid diagram", exact: true }),
  ).toBeVisible()
  await expect(firstSource).toBeHidden()
  await expect(secondSource).toBeHidden()
  expect(requests).toEqual(
    expect.arrayContaining([
      expect.stringContaining("Source --> Renderer --> SVG"),
      expect.stringContaining("Start"),
    ]),
  )
})
