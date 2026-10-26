import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"

async function openExample(page: Page) {
  await page.goto("/editor/examples#public-document-export")
  const example = page.locator("#editor-example-public-document-export")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Document export example",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(
    example.getByRole("group", { name: "Document print", exact: true }),
  ).toBeVisible()
  await expect(
    example.getByRole("group", { name: "Document image export", exact: true }),
  ).toBeVisible()

  return { editor, example }
}

async function holdPngConversion(page: Page) {
  await page.addInitScript(() => {
    let resolvePng: BlobCallback | undefined

    HTMLCanvasElement.prototype.toBlob = function holdPng(callback) {
      resolvePng = callback
      window.dispatchEvent(new Event("editor-export-png-pending"))
    }

    window.addEventListener("editor-export-release-png", () => {
      const resolve = resolvePng
      resolvePng = undefined
      resolve?.(null)
    })
  })
}

test("rejects over-budget print layout before opening the native dialog", async ({
  page,
  context,
}) => {
  test.slow()
  let printCalls = 0

  await context.exposeBinding("recordEditorExportPrint", () => {
    printCalls += 1
  })
  await context.addInitScript(() => {
    const printWindow: Window & {
      recordEditorExportPrint?: (this: void) => Promise<void>
    } = window

    window.print = function print() {
      void printWindow.recordEditorExportPrint?.()
      window.dispatchEvent(new Event("afterprint"))
    }
  })

  const { editor, example } = await openExample(page)
  await editor.evaluate((element) => {
    element.style.minBlockSize = "0"
    element.style.maxBlockSize = "12rem"
    element.style.overflow = "auto"
  })
  await editor.fill("Tall print line\n".repeat(1200).trimEnd())

  const before = await editor.innerText()
  const opened = page.waitForEvent("popup")
  await example
    .getByRole("button", { name: "Print document", exact: true })
    .click()
  const popup = await opened

  await expect(example.getByRole("alert")).toBeVisible()
  await expect.poll(() => popup.isClosed()).toBe(true)
  expect(printCalls).toBe(0)
  expect(await editor.innerText()).toBe(before)
  await expect(editor).toHaveAttribute("contenteditable", "true")
})

test("prints a validated rich document from its owner frame without changing editor state", async ({
  page,
  context,
}) => {
  test.slow()
  await context.addInitScript(() => {
    window.print = () => {
      document.documentElement.setAttribute("data-print-called", "true")
    }
  })
  await page.goto("/")
  await page.evaluate(() => {
    const frame = document.createElement("iframe")
    frame.title = "Document export host"
    frame.src = `${location.origin}/editor/examples#public-document-export`
    document.body.append(frame)
  })

  const frame = page.frameLocator('iframe[title="Document export host"]')
  const example = frame.locator("#editor-example-public-document-export")
  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  const editor = example.getByRole("textbox", {
    name: "Document export example",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")

  await example
    .getByRole("button", { name: "Make export editor read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  const stateBefore = await editor.innerText()
  const undo = example.getByRole("button", { name: "Undo", exact: true })
  const redo = example.getByRole("button", { name: "Redo", exact: true })
  await expect(undo).toBeDisabled()

  const popupPromise = page.waitForEvent("popup")
  await example
    .getByRole("button", { name: "Print document", exact: true })
    .click()
  const popup = await popupPromise
  await expect(popup.locator("html")).toHaveAttribute(
    "data-print-called",
    "true",
  )
  await expect(popup.locator("table")).toHaveCount(1)
  await expect(
    popup.getByText("Export list item", { exact: true }),
  ).toBeVisible()
  await expect(popup.locator("math")).toHaveCount(1)
  await expect(popup.locator("script, iframe, object, embed")).toHaveCount(0)
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await expect(editor).toHaveText(stateBefore)
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])

  const closed = popup.waitForEvent("close")
  await popup.evaluate(() => window.dispatchEvent(new Event("afterprint")))
  await closed
  await expect(
    example.getByRole("button", { name: "Print document", exact: true }),
  ).toBeFocused()
})

test("downloads a bounded PNG and preserves editor content and history", async ({
  page,
}, testInfo) => {
  test.slow()
  const { editor, example } = await openExample(page)
  const stateBefore = await editor.innerText()
  const undo = example.getByRole("button", { name: "Undo", exact: true })
  await expect(undo).toBeDisabled()
  await editor.press("ControlOrMeta+a")

  const selectionBefore = await page.evaluate(
    () => window.getSelection()?.toString() ?? "",
  )

  expect(selectionBefore).not.toBe("")

  const downloadPromise = page.waitForEvent("download")
  await example
    .getByRole("button", { name: "Export document as PNG", exact: true })
    .click()
  const download = await downloadPromise
  const path = testInfo.outputPath("document-export.png")
  await download.saveAs(path)
  const bytes = await readFile(path)
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  )
  expect(bytes.byteLength).toBeGreaterThan(32)
  expect(bytes.byteLength).toBeLessThanOrEqual(16_777_216)
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(0)
  expect(bytes.readUInt32BE(16)).toBeLessThanOrEqual(4096)
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(0)
  expect(bytes.readUInt32BE(20)).toBeLessThanOrEqual(16_384)
  expect(bytes.readUInt32BE(16) * bytes.readUInt32BE(20)).toBeLessThanOrEqual(
    16_777_216,
  )
  expect(await editor.innerText()).toBe(stateBefore)
  await expect(undo).toBeDisabled()
  await expect(
    example
      .getByRole("group", { name: "Document image export", exact: true })
      .getByRole("status"),
  ).toContainText("PNG")
  await expect(
    example.getByRole("button", {
      name: "Export document as PNG",
      exact: true,
    }),
  ).toBeFocused()
  expect(
    await page.evaluate(() => window.getSelection()?.toString() ?? ""),
  ).toBe(selectionBefore)

  await testInfo.attach("document-export", {
    path,
    contentType: "image/png",
  })
})

test("cancels stale and unmounted image exports without downloading partial bytes", async ({
  page,
}) => {
  test.slow()
  await holdPngConversion(page)
  const { editor, example } = await openExample(page)

  await page.evaluate(() => {
    window.addEventListener(
      "editor-export-png-pending",
      () => document.documentElement.setAttribute("data-png-pending", "true"),
      { once: true },
    )
  })
  const downloads: string[] = []
  page.on("download", (download) =>
    downloads.push(download.suggestedFilename()),
  )
  await example
    .getByRole("button", { name: "Export document as PNG", exact: true })
    .click()
  await expect(page.locator("html")).toHaveAttribute("data-png-pending", "true")
  await editor.fill("Changed while capture was pending")
  await page.evaluate(() =>
    window.dispatchEvent(new Event("editor-export-release-png")),
  )
  await expect(example.getByRole("alert")).toContainText(/document changed/i)
  await expect(editor).toBeFocused()
  expect(downloads).toEqual([])

  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-png-pending")
    window.addEventListener(
      "editor-export-png-pending",
      () => document.documentElement.setAttribute("data-png-pending", "true"),
      { once: true },
    )
  })
  await example
    .getByRole("button", { name: "Export document as PNG", exact: true })
    .click()
  await expect(page.locator("html")).toHaveAttribute("data-png-pending", "true")

  const imageControls = example.getByRole("group", {
    name: "Document image export",
    exact: true,
  })

  const cancel = imageControls.getByRole("button", {
    name: "Cancel document export",
    exact: true,
  })

  await cancel.evaluate((button) =>
    button.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    }),
  )
  await cancel.click()
  await expect(cancel).toBeEnabled()
  await expect(
    imageControls.getByRole("button", {
      name: "Export document as PNG",
      exact: true,
    }),
  ).toBeDisabled()
  await cancel.click()
  await page.evaluate(() =>
    window.dispatchEvent(new Event("editor-export-release-png")),
  )
  await expect(imageControls.getByRole("status")).toContainText(/cancelled/i)
  expect(downloads).toEqual([])

  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-png-pending")
    window.addEventListener(
      "editor-export-png-pending",
      () => document.documentElement.setAttribute("data-png-pending", "true"),
      { once: true },
    )
  })
  await example
    .getByRole("button", { name: "Export document as PNG", exact: true })
    .click()
  await expect(page.locator("html")).toHaveAttribute("data-png-pending", "true")
  await example
    .getByRole("button", { name: "Unmount export editor", exact: true })
    .click()
  await expect(example.getByRole("textbox")).toHaveCount(0)
  await page.evaluate(() =>
    window.dispatchEvent(new Event("editor-export-release-png")),
  )
  expect(downloads).toEqual([])
})

test("reports blocked print popups and keeps read-only export controls usable", async ({
  page,
}) => {
  test.slow()
  const { editor, example } = await openExample(page)
  await example
    .getByRole("button", { name: "Make export editor read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await page.evaluate(() => {
    window.open = () => null
  })

  await example
    .getByRole("button", { name: "Print document", exact: true })
    .click()
  await expect(example.getByRole("alert")).toContainText("popups")
  await expect(
    example.getByRole("button", {
      name: "Export document as PNG",
      exact: true,
    }),
  ).toBeEnabled()
  await expect(editor).toHaveText(/Export list item/)
})
