import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import { z } from "zod"

async function openDrawingExample(page: Page) {
  await page.goto("/editor/examples#public-drawing")
  const example = page.getByTestId("editor-example-public-drawing")

  await example
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", {
      name: "Public drawing editor",
      exact: true,
    }),
  ).toHaveAttribute("contenteditable", "true")
  await example
    .getByRole("checkbox", {
      name: "Drawing assets are installed",
      exact: true,
    })
    .check()
  await example
    .getByRole("button", { name: "Insert shape fixture", exact: true })
    .click()

  return example
}

async function chooseRectangle(dialog: Locator) {
  const radio = dialog.getByTestId("toolbar-rectangle")

  await radio.locator("..").click()
  await expect(radio).toBeChecked()
}

async function addRectangle(page: Page, dialog: Locator) {
  await chooseRectangle(dialog)
  const canvas = dialog.locator("canvas").last()
  const bounds = await canvas.boundingBox()

  if (!bounds) throw new Error("Excalidraw canvas is not visible")

  const x = bounds.x + Math.min(280, bounds.width * 0.6)

  await page.mouse.move(x, bounds.y + 70)
  await page.mouse.down()
  await page.mouse.move(
    x + Math.min(120, bounds.width * 0.25),
    bounds.y + 150,
    { steps: 8 },
  )
  await page.mouse.up()
}

const drawingExportSchema = z.object({
  elements: z.array(
    z
      .object({
        id: z.string(),
        type: z.enum([
          "rectangle",
          "ellipse",
          "diamond",
          "line",
          "arrow",
          "freedraw",
          "text",
        ]),
        customData: z.never().optional(),
        fileId: z.never().optional(),
        image: z.never().optional(),
        link: z.null().optional(),
        src: z.never().optional(),
        url: z.never().optional(),
      })
      .catchall(z.json()),
  ),
  files: z.record(z.string(), z.never()),
})

test("downloads bounded JSON and PNG from a dirty scene without saving it", async ({
  page,
}, testInfo) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  const example = await openDrawingExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public drawing editor",
    exact: true,
  })

  const drawing = editor.locator("figure[data-editor-drawing]")
  const savedScene = await drawing.getAttribute("data-editor-drawing-scene")

  if (savedScene === null) throw new Error("Missing saved drawing metadata")

  await example
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "Edit drawing", exact: true })

  await expect(dialog.locator("canvas").last()).toBeVisible()
  await addRectangle(page, dialog)
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", savedScene)

  const jsonDownloadPromise = page.waitForEvent("download")

  await dialog
    .getByRole("button", { name: "Export drawing JSON", exact: true })
    .click()
  const jsonDownload = await jsonDownloadPromise

  expect(jsonDownload.suggestedFilename()).toBe("drawing.excalidraw")
  const jsonPath = testInfo.outputPath("drawing.excalidraw")

  await jsonDownload.saveAs(jsonPath)
  const jsonText = await readFile(jsonPath, "utf8")
  const exportedDrawing = drawingExportSchema.parse(JSON.parse(jsonText))
  const exportedElements = exportedDrawing.elements.length

  expect(exportedDrawing.files).toEqual({})

  expect(exportedElements).toBeGreaterThan(2)
  expect(Buffer.byteLength(jsonText)).toBeLessThanOrEqual(16_777_216)

  const pngDownloadPromise = page.waitForEvent("download")

  await dialog
    .getByRole("button", { name: "Export drawing PNG", exact: true })
    .click()
  const pngDownload = await pngDownloadPromise

  expect(pngDownload.suggestedFilename()).toBe("drawing.png")
  const pngPath = testInfo.outputPath("drawing.png")

  await pngDownload.saveAs(pngPath)
  const png = await readFile(pngPath)
  const pngView = new DataView(png.buffer, png.byteOffset, png.byteLength)

  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  expect(pngView.getUint32(16)).toBeGreaterThan(0)
  expect(pngView.getUint32(20)).toBeGreaterThan(0)
  expect(pngView.getUint32(16)).toBeLessThanOrEqual(4096)
  expect(pngView.getUint32(20)).toBeLessThanOrEqual(16384)
  expect(pngView.getUint32(16) * pngView.getUint32(20)).toBeLessThanOrEqual(
    16_777_216,
  )
  expect(png.byteLength).toBeLessThanOrEqual(16_777_216)
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", savedScene)

  await testInfo.attach("drawing-export-json", {
    path: jsonPath,
    contentType: "application/json",
  })
  await testInfo.attach("drawing-export-png", {
    path: pngPath,
    contentType: "image/png",
  })
  expect(errors).toEqual([])
})

test("copies PNG only for an unprevented click and reports clipboard completion", async ({
  page,
}) => {
  test.slow()
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])

  const example = await openDrawingExample(page)

  await example
    .getByRole("button", { name: "Edit drawing", exact: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "Edit drawing", exact: true })

  await expect(dialog.locator("canvas").last()).toBeVisible()

  const copyButton = dialog.getByRole("button", {
    name: "Copy drawing PNG",
    exact: true,
  })

  await page.evaluate(async () => {
    await navigator.clipboard.writeText("clipboard sentinel")
  })
  await copyButton.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      capture: true,
      once: true,
    })
  })
  await copyButton.click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("clipboard sentinel")

  await copyButton.click()
  await expect(dialog.getByRole("status")).toBeVisible()

  const copied = await page.evaluate(async () => {
    const items = await navigator.clipboard.read()
    const item = items.find((entry) => entry.types.includes("image/png"))

    if (!item) return null

    const image = await item.getType("image/png")
    const bytes = new Uint8Array(await image.arrayBuffer())

    return {
      type: image.type,
      size: image.size,
      signature: [...bytes.subarray(0, 8)],
    }
  })

  expect(copied).not.toBeNull()
  expect(copied?.type).toBe("image/png")
  expect(copied?.size).toBeLessThanOrEqual(16_777_216)
  expect(copied?.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10])

  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "write", {
      configurable: true,
      value: () =>
        Promise.reject(
          new DOMException("Clipboard write cancelled", "AbortError"),
        ),
    })
  })
  await copyButton.click()
  await expect(dialog.getByRole("alert")).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Export drawing PNG", exact: true }),
  ).toBeEnabled()
})

test("read-only View drawing keeps the bounded exports available", async ({
  page,
}, testInfo) => {
  test.slow()

  const example = await openDrawingExample(page)

  const editor = example.getByRole("textbox", {
    name: "Public drawing editor",
    exact: true,
  })

  const drawing = editor.locator("figure[data-editor-drawing]")

  const savedScene = await drawing.getAttribute("data-editor-drawing-scene")

  if (savedScene === null) throw new Error("Missing saved drawing metadata")

  await example
    .getByRole("checkbox", { name: "Read-only editor", exact: true })
    .check()
  await example
    .getByRole("button", { name: "View drawing", exact: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "View drawing", exact: true })

  await expect(dialog.locator("canvas").last()).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Apply drawing", exact: true }),
  ).toBeDisabled()

  const jsonDownloadPromise = page.waitForEvent("download")

  await dialog
    .getByRole("button", { name: "Export drawing JSON", exact: true })
    .click()

  const jsonDownload = await jsonDownloadPromise

  const jsonPath = testInfo.outputPath("readonly-drawing.excalidraw")

  await jsonDownload.saveAs(jsonPath)

  const exportedDrawing = drawingExportSchema.parse(
    JSON.parse(await readFile(jsonPath, "utf8")),
  )

  expect(exportedDrawing.elements.length).toBeGreaterThan(0)
  expect(exportedDrawing.files).toEqual({})

  const pngDownloadPromise = page.waitForEvent("download")

  await dialog
    .getByRole("button", { name: "Export drawing PNG", exact: true })
    .click()

  const pngDownload = await pngDownloadPromise

  expect(pngDownload.suggestedFilename()).toBe("drawing.png")
  await expect(drawing).toHaveAttribute("data-editor-drawing-scene", savedScene)
})
