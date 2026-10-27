import { expect, test, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><rect x="2" y="2" width="236" height="76" fill="#ffffff" stroke="#111111"/><text x="16" y="44" fill="#111111">Native diagram fixture</text></svg>'

const exampleSelector = "#public-code-drawing"

async function renderDiagram(page: Page) {
  const example = page.locator(exampleSelector)

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

  return { example, editor, source }
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/editor/diagram-fixture", async (route) => {
    await route.fulfill({ contentType: "image/svg+xml", body: svg })
  })
  await page.goto("/editor/examples#public-code-drawing")
  const example = page.locator(exampleSelector)

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

test("downloads bounded PNG from current sanitized diagram", async ({
  page,
}, testInfo) => {
  test.slow()
  const { editor, example, source } = await renderDiagram(page)
  const sourceBefore = (await source.textContent()) ?? ""
  const downloadPromise = page.waitForEvent("download")

  await example
    .getByRole("button", { name: "Download diagram as PNG", exact: true })
    .click()

  const download = await downloadPromise
  const path = testInfo.outputPath("mermaid-diagram.png")
  await download.saveAs(path)

  const bytes = await readFile(path)
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)

  expect(download.suggestedFilename()).toBe("mermaid-diagram.png")
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  )
  expect(bytes.byteLength).toBeGreaterThan(32)
  expect(bytes.byteLength).toBeLessThanOrEqual(16_777_216)
  expect(width).toBeGreaterThan(0)
  expect(width).toBeLessThanOrEqual(4096)
  expect(height).toBeGreaterThan(0)
  expect(height).toBeLessThanOrEqual(16_384)
  expect(width * height).toBeLessThanOrEqual(16_777_216)
  await expect(source).toHaveText(sourceBefore)
  await expect(editor).toHaveAttribute("contenteditable", "true")

  await testInfo.attach("editor-diagram-png", {
    path,
    contentType: "image/png",
  })
})

test("honors prevented PNG download clicks", async ({ page }) => {
  const { example } = await renderDiagram(page)

  const button = example.getByRole("button", {
    name: "Download diagram as PNG",
    exact: true,
  })

  await button.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    })
  })

  const noDownload = page.waitForEvent("download", { timeout: 500 }).then(
    () => false,
    () => true,
  )

  await button.click()
  expect(await noDownload).toBe(true)
  await expect(button).toHaveAttribute("aria-busy", "false")
})

test("keeps default SVG download enabled in read-only mode", async ({
  page,
}, testInfo) => {
  const { example, editor } = await renderDiagram(page)
  await example
    .getByRole("button", { name: "Read-only diagram", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")

  const downloadButton = example.getByRole("button", {
    name: "Download diagram as SVG",
    exact: true,
  })

  await editor
    .getByRole("img", { name: "mermaid diagram", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(downloadButton).toBeEnabled()

  const downloadPromise = page.waitForEvent("download")
  await downloadButton.click()
  const download = await downloadPromise
  const path = testInfo.outputPath("mermaid-diagram.svg")
  await download.saveAs(path)

  expect(download.suggestedFilename()).toBe("mermaid-diagram.svg")
  expect((await readFile(path)).toString("utf8")).toContain("<svg")
})
