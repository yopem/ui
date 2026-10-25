import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

async function openExample(page: Page) {
  await page.goto("/editor/examples#public-docx")
  const example = page.locator("#editor-example-public-docx")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Native Word document",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  return { editor, example }
}

test("DOCX downloads real archive bytes and imports the same semantic document", async ({
  page,
}, testInfo) => {
  test.slow()
  const { editor, example } = await openExample(page)
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await editor.fill("Word roundtrip")
  await editor.press("ControlOrMeta+a")
  await example.getByRole("button", { name: "Bold", exact: true }).click()
  await expect(editor.locator("strong,b")).toHaveText("Word roundtrip")
  const downloadPromise = page.waitForEvent("download")
  await example
    .getByRole("button", { name: "Download Word document", exact: true })
    .click()
  const download = await downloadPromise
  const path = testInfo.outputPath("native-document.docx")
  await download.saveAs(path)
  const bytes = await readFile(path)
  expect(bytes.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  expect(bytes.byteLength).toBeLessThanOrEqual(1_048_576)
  await editor.fill("Replacement before import")
  await example
    .getByLabel("Word document file", { exact: true })
    .setInputFiles(path)
  await example
    .getByRole("button", { name: "Import Word document", exact: true })
    .click()
  await expect(editor.locator("strong,b")).toHaveText("Word roundtrip")
  await expect(example.getByRole("alert")).toHaveCount(0)
  await example.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(editor).toHaveText("Replacement before import")
  await example.getByRole("button", { name: "Redo", exact: true }).click()
  await expect(editor.locator("strong,b")).toHaveText("Word roundtrip")
  expect(errors).toEqual([])
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
  await testInfo.attach("semantic-docx", { path, contentType: docxMimeType })
})

test("DOCX rejects invalid and oversized files without changing native content", async ({
  page,
}) => {
  test.slow()
  const { editor, example } = await openExample(page)
  await editor.fill("Keep Word content")

  for (const buffer of [
    Buffer.from("Invalid archive"),
    Buffer.alloc(1_048_577, 65),
  ]) {
    await example
      .getByLabel("Word document file", { exact: true })
      .setInputFiles({
        name: "rejected.docx",
        mimeType: docxMimeType,
        buffer,
      })
    await example
      .getByRole("button", { name: "Import Word document", exact: true })
      .click()
    await expect(example.getByRole("alert")).toBeVisible()
    await expect(editor).toHaveText("Keep Word content")
    await expect(editor).toHaveAttribute("contenteditable", "true")
  }

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
})

test("DOCX read-only roots reject import and still download existing content", async ({
  page,
}) => {
  test.slow()
  const { editor, example } = await openExample(page)
  await editor.fill("Read-only Word document")
  await example
    .getByRole("button", { name: "Enable Word read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(
    example.getByLabel("Word document file", { exact: true }),
  ).toBeDisabled()
  await expect(
    example.getByRole("button", { name: "Import Word document", exact: true }),
  ).toBeDisabled()
  const downloadPromise = page.waitForEvent("download")
  await example
    .getByRole("button", { name: "Download Word document", exact: true })
    .click()
  await downloadPromise
  await expect(editor).toHaveText("Read-only Word document")
  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
})

test("DOCX controls stay bounded and accessible at each viewport", async ({
  page,
}, testInfo) => {
  test.slow()
  const { editor, example } = await openExample(page)
  await editor.fill("LongWord".repeat(40))

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations).toEqual([])
    await testInfo.attach(`docx-${width}`, {
      body: await example.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  }
})
