import AxeBuilder from "@axe-core/playwright"
import { assertEditorDocumentExportPNG } from "@editor/document-export-model"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"

interface CanvasEncoderPrototype {
  toBlob: (
    this: HTMLCanvasElement,
    ...args: Parameters<HTMLCanvasElement["toBlob"]>
  ) => void
}

interface ImageDecoderPrototype {
  decode: (this: HTMLImageElement) => Promise<void>
}

const executeFile = promisify(execFile)

async function waitForPDFEditor(editor: Locator) {
  await expect(editor).toBeVisible()
  await expect(editor).toHaveAttribute("data-lexical-editor", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveText(/\S/)
}

function readPDFSelection(page: Page) {
  return page
    .getByRole("textbox", { name: "PDF export example", exact: true })
    .evaluate((element) => {
      const selection = element.ownerDocument.getSelection()

      if (
        !selection?.anchorNode ||
        !selection.focusNode ||
        !element.contains(selection.anchorNode) ||
        !element.contains(selection.focusNode)
      )
        throw new Error("PDF selection must stay inside the editor.")

      function point(node: Node, offset: number) {
        const path: number[] = []
        let current: Node | null = node

        while (current && current !== element) {
          let index = 0

          for (
            let sibling = current.previousSibling;
            sibling;
            sibling = sibling.previousSibling
          )
            index++

          path.unshift(index)
          current = current.parentNode
        }

        return { path, nodeType: node.nodeType, offset }
      }

      return {
        text: selection.toString(),
        anchor: point(selection.anchorNode, selection.anchorOffset),
        focus: point(selection.focusNode, selection.focusOffset),
      }
    })
}

async function preparePDFState(page: Page, editor: Locator) {
  const seed = await editor.innerText()
  const undo = page.getByRole("button", { name: "Undo", exact: true })
  const redo = page.getByRole("button", { name: "Redo", exact: true })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()
  await editor.press("ControlOrMeta+End")
  await editor.pressSequentially(" PDF history marker.")
  await expect(editor).toHaveText(`${seed} PDF history marker.`)
  await expect(undo).toBeEnabled()
  await expect(redo).toBeDisabled()
  const before = await editor.innerText()
  await editor.press("ControlOrMeta+a")
  const selection = await readPDFSelection(page)
  expect(selection.text).toBe(before)

  return { seed, before, selection, undo, redo }
}

async function verifyPDFHistory(
  editor: Locator,
  state: Awaited<ReturnType<typeof preparePDFState>>,
) {
  await expect(state.undo).toBeEnabled()
  await expect(state.redo).toBeDisabled()
  await state.undo.click()
  await expect(editor).toHaveText(state.seed)
  await expect(state.undo).toBeDisabled()
  await expect(state.redo).toBeEnabled()
  await state.redo.click()
  await expect(editor).toHaveText(state.before)
  await expect(state.undo).toBeEnabled()
  await expect(state.redo).toBeDisabled()
}

async function openPDF(page: Page) {
  await page.goto("/editor/document-pdf-export-control")

  const controls = page.getByRole("group", {
    name: "Document PDF export",
    exact: true,
  })

  const editor = page.getByRole("textbox", {
    name: "PDF export example",
    exact: true,
  })

  await expect(controls).toBeVisible()
  await waitForPDFEditor(editor)

  return {
    controls,
    editor,
    exportButton: controls.getByRole("button", {
      name: "Export document as PDF",
      exact: true,
    }),
  }
}

test("downloads and renders one raster PDF page; preserves content, selection, history, and read-only state @a11y", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.addInitScript(() => {
    const canvasPrototype: CanvasEncoderPrototype = HTMLCanvasElement.prototype
    const toBlob = canvasPrototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function recordPDFDimensions(
      callback,
      type,
      quality,
    ) {
      if (type === "image/png") {
        const context = this.getContext("2d")

        if (!context) throw new Error("PDF capture needs a canvas context.")
        context.clearRect(this.width - 8, this.height - 8, 8, 8)
        document.documentElement.setAttribute(
          "data-pdf-transparent-rgba",
          Array.from(
            context.getImageData(this.width - 1, this.height - 1, 1, 1).data,
          ).join(" "),
        )
        context.fillStyle = "black"
        context.fillRect(16, 16, 8, 8)
        document.documentElement.setAttribute(
          "data-pdf-capture-size",
          `${this.width} ${this.height}`,
        )
      }

      if (type === "image/jpeg") {
        const context = this.getContext("2d")

        if (!context) throw new Error("PDF output needs a canvas context.")
        document.documentElement.setAttribute(
          "data-pdf-white-rgba",
          Array.from(
            context.getImageData(this.width - 1, this.height - 1, 1, 1).data,
          ).join(" "),
        )
        document.documentElement.setAttribute(
          "data-pdf-size",
          `${this.width} ${this.height}`,
        )
      }

      toBlob.call(this, callback, type, quality)
    }

    window.print = function unexpectedPrint() {
      throw new Error("PDF export must not print.")
    }
  })
  const { controls, editor, exportButton } = await openPDF(page)
  const state = await preparePDFState(page, editor)

  for (const readonly of [false, true]) {
    if (readonly)
      await page
        .getByRole("button", { name: "Make PDF editor read-only", exact: true })
        .click()
    const downloadPromise = page.waitForEvent("download")
    await exportButton.focus()
    await exportButton.press("Enter")
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("plate.pdf")
    const path = testInfo.outputPath(readonly ? "readonly.pdf" : "editable.pdf")
    await download.saveAs(path)
    expect(await download.failure()).toBeNull()
    await testInfo.attach(readonly ? "readonly-pdf" : "editable-pdf", {
      path,
      contentType: "application/pdf",
    })
    const bytes = await readFile(path)
    expect(bytes.byteLength).toBeLessThanOrEqual(16_777_216)

    const imageDictionaries = bytes
      .toString("latin1")
      .match(/<<[^<>]*\/Subtype\s+\/Image\b[^<>]*>>/g)

    expect(imageDictionaries).toHaveLength(1)
    const imageDictionary = imageDictionaries?.[0] ?? ""
    expect(imageDictionary).toMatch(/\/ColorSpace\s+\/DeviceRGB\b/)
    expect(imageDictionary).toMatch(/\/BitsPerComponent\s+8\b/)
    expect(imageDictionary).toMatch(/\/Filter\s+\/DCTDecode\b/)
    expect(imageDictionary).not.toMatch(/\/(?:SMask|Mask)\b/)

    const { stdout: info, stderr } = await executeFile("/usr/bin/pdfinfo", [
      path,
    ])

    await testInfo.attach(readonly ? "readonly-pdfinfo" : "editable-pdfinfo", {
      body: JSON.stringify({ stdout: info, stderr }),
      contentType: "application/json",
    })

    expect(stderr).toBe("")
    expect(info).toMatch(/Pages:\s+1\b/)
    expect(info).toMatch(/JavaScript:\s+no\b/)
    const size = /Page size:\s+([\d.]+) x ([\d.]+) pts/.exec(info)
    expect(size).not.toBeNull()
    const width = Number(size?.[1])
    const height = Number(size?.[2])
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThanOrEqual(4096)
    expect(height).toBeGreaterThan(0)
    expect(height).toBeLessThanOrEqual(16384)
    expect(width * height).toBeLessThanOrEqual(16_777_216)
    expect(Number(/\/Width\s+(\d+)/.exec(imageDictionary)?.[1])).toBe(width)
    expect(Number(/\/Height\s+(\d+)/.exec(imageDictionary)?.[1])).toBe(height)
    await expect(page.locator("html")).toHaveAttribute(
      "data-pdf-size",
      `${width} ${height}`,
    )
    await expect(page.locator("html")).toHaveAttribute(
      "data-pdf-capture-size",
      `${width} ${height}`,
    )
    await expect(page.locator("html")).toHaveAttribute(
      "data-pdf-transparent-rgba",
      "0 0 0 0",
    )
    await expect(page.locator("html")).toHaveAttribute(
      "data-pdf-white-rgba",
      "255 255 255 255",
    )

    const prefix = testInfo.outputPath(
      readonly ? "readonly-render" : "editable-render",
    )

    const raster = await executeFile("/usr/bin/pdftoppm", [
      "-singlefile",
      "-r",
      "72",
      path,
      prefix,
    ])

    await testInfo.attach(
      readonly ? "readonly-rasterizer" : "editable-rasterizer",
      {
        body: JSON.stringify(raster),
        contentType: "application/json",
      },
    )
    expect(raster.stderr).toBe("")
    const ppmPath = `${prefix}.ppm`
    await testInfo.attach(readonly ? "readonly-render" : "editable-render", {
      path: ppmPath,
      contentType: "image/x-portable-pixmap",
    })
    const ppm = await readFile(ppmPath)

    const header = /^P6\s+(\d+)\s+(\d+)\s+255\s/.exec(
      ppm.subarray(0, 100).toString("ascii"),
    )

    expect(header).not.toBeNull()
    expect(Number(header?.[1])).toBe(width)
    expect(Number(header?.[2])).toBe(height)
    const pixels = ppm.subarray(header?.[0].length ?? 0)
    expect(pixels.byteLength).toBe(width * height * 3)

    for (const sample of [pixels.subarray(0, 3), pixels.subarray(-3)]) {
      expect(
        Math.min(...sample),
        "JPEG near-white sample",
      ).toBeGreaterThanOrEqual(250)
      expect(
        Math.max(...sample) - Math.min(...sample),
        "Neutral white sample",
      ).toBeLessThanOrEqual(2)
    }

    const markerOffset = (20 * width + 20) * 3
    const marker = pixels.subarray(markerOffset, markerOffset + 3)
    expect(marker).toHaveLength(3)
    expect(Math.max(...marker)).toBeLessThan(100)
    expect(pixels.some((channel) => channel < 100)).toBe(true)
    expect(pixels.filter((channel) => channel > 245).length).toBeGreaterThan(
      pixels.length / 2,
    )
    await expect(exportButton).toBeFocused()
    await expect(controls).toHaveAttribute("aria-busy", "false")
    expect(await editor.innerText()).toBe(state.before)
    await expect(editor).toHaveAttribute(
      "contenteditable",
      readonly ? "false" : "true",
    )

    const accessibility = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(
      readonly ? "readonly-pdf-accessibility" : "editable-pdf-accessibility",
      {
        body: JSON.stringify(accessibility),
        contentType: "application/json",
      },
    )
    expect(accessibility.violations).toEqual([])

    if (readonly) {
      await expect(state.undo).toBeDisabled()
      await expect(state.redo).toBeDisabled()
    } else {
      expect(await readPDFSelection(page)).toEqual(state.selection)
      await verifyPDFHistory(editor, state)
    }

    await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
  }

  await page
    .getByRole("button", { name: "Enable PDF editor editing", exact: true })
    .click()
  await waitForPDFEditor(editor)
  await verifyPDFHistory(editor, state)
  await testInfo.attach("pdf-state", {
    body: JSON.stringify({
      before: state.before,
      selection: state.selection,
      after: await editor.innerText(),
    }),
    contentType: "application/json",
  })
  await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
})

for (const mode of ["cancel", "stale", "deadline", "unmount"] as const) {
  test(`PDF ${mode} discards output and holds shared capacity until capture settles`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      const canvasPrototype: CanvasEncoderPrototype =
        HTMLCanvasElement.prototype

      const toBlob = canvasPrototype.toBlob
      let pending = true
      HTMLCanvasElement.prototype.toBlob = function holdCapture(
        callback,
        type,
        quality,
      ) {
        if (type !== "image/png" || !pending)
          return toBlob.call(this, callback, type, quality)
        pending = false
        document.documentElement.setAttribute("data-pdf-pending", "true")
        window.addEventListener(
          "release-pdf-capture",
          () => toBlob.call(this, callback, type, quality),
          { once: true },
        )
      }
    })
    const { controls, editor, exportButton } = await openPDF(page)
    const state = await preparePDFState(page, editor)
    await page.clock.install()
    const downloads: string[] = []
    page.on("download", (download) =>
      downloads.push(download.suggestedFilename()),
    )
    await exportButton.click()
    await expect(page.locator("html")).toHaveAttribute(
      "data-pdf-pending",
      "true",
    )
    await expect(exportButton).toBeDisabled()

    if (mode === "cancel")
      await controls
        .getByRole("button", { name: "Cancel document export", exact: true })
        .click()

    let expectedSelection = state.selection

    if (mode === "stale") {
      await editor.fill("Changed during PDF capture")
      expectedSelection = await readPDFSelection(page)
    }

    if (mode === "deadline") await page.clock.fastForward(30_001)

    if (mode === "unmount")
      await page
        .getByRole("button", { name: "Unmount PDF editor", exact: true })
        .click()

    if (mode !== "unmount") {
      await expect(controls.getByRole("alert")).toBeVisible()
      await exportButton.click()
      await expect(controls.getByRole("alert")).toContainText(
        "Another document export",
      )
    } else {
      await page
        .getByRole("button", { name: "Mount PDF editor", exact: true })
        .click()
      await waitForPDFEditor(editor)
      await exportButton.click()
      await expect(page.getByRole("alert")).toContainText(
        "Another document export",
      )
    }

    await page.evaluate(() =>
      window.dispatchEvent(new Event("release-pdf-capture")),
    )
    await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
    await expect(controls).toHaveAttribute("aria-busy", "false")
    expect(downloads).toEqual([])

    if (mode === "stale") {
      await expect(editor).toHaveText("Changed during PDF capture")
      expect(await readPDFSelection(page)).toEqual(expectedSelection)
      await expect(state.undo).toBeEnabled()
      await expect(state.redo).toBeDisabled()
    } else if (mode === "unmount") {
      await expect(editor).toHaveText(state.seed)
      await expect(state.undo).toBeDisabled()
      await expect(state.redo).toBeDisabled()
    } else {
      expect(await editor.innerText()).toBe(state.before)
      expect(await readPDFSelection(page)).toEqual(state.selection)
      await verifyPDFHistory(editor, state)
    }

    await testInfo.attach("discarded-pdf-downloads", {
      body: JSON.stringify({
        mode,
        downloads,
        content: await editor.innerText(),
      }),
      contentType: "application/json",
    })
    const recoveredContent = await editor.innerText()
    await editor.press("ControlOrMeta+a")
    const recoveredSelection = await readPDFSelection(page)
    expect(recoveredSelection.text).toBe(recoveredContent)
    const recoveredDownload = page.waitForEvent("download")
    await exportButton.click()
    const download = await recoveredDownload
    const path = testInfo.outputPath(`${mode}-recovery.pdf`)
    await download.saveAs(path)
    expect(await download.failure()).toBeNull()
    expect(downloads).toEqual(["plate.pdf"])
    expect(await editor.innerText()).toBe(recoveredContent)
    expect(await readPDFSelection(page)).toEqual(recoveredSelection)
    await expect(controls).toHaveAttribute("aria-busy", "false")
    await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
    await testInfo.attach("recovered-pdf", {
      path,
      contentType: "application/pdf",
    })
  })
}

for (const failure of [
  "invalid-png",
  "crc",
  "dimensions",
  "oversized",
  "decode",
  "jpeg",
] as const) {
  test(`PDF rejects ${failure} without download`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript((kind) => {
      const canvasPrototype: CanvasEncoderPrototype =
        HTMLCanvasElement.prototype

      const toBlob = canvasPrototype.toBlob
      let failing = true
      window.addEventListener(
        "restore-pdf-capture",
        () => {
          failing = false
        },
        { once: true },
      )

      if (kind === "decode") {
        const createObjectURL = URL.createObjectURL.bind(URL)
        const revokeObjectURL = URL.revokeObjectURL.bind(URL)
        let rejectedURL: string | null = null

        URL.createObjectURL = function revokePNGSource(blob) {
          const url = createObjectURL(blob)

          if (failing && blob instanceof Blob && blob.type === "image/png") {
            rejectedURL = url
            revokeObjectURL(url)
            document.documentElement.setAttribute(
              "data-pdf-source-revoked",
              "true",
            )
          }

          return url
        }

        URL.revokeObjectURL = function recordPDFSourceCleanup(url) {
          if (url === rejectedURL)
            document.documentElement.setAttribute(
              "data-pdf-source-cleaned",
              "true",
            )

          revokeObjectURL(url)
        }

        const imagePrototype: ImageDecoderPrototype = HTMLImageElement.prototype
        const decode = imagePrototype.decode
        imagePrototype.decode = function recordNativeDecode() {
          const decoding = decode.call(this)

          if (this.src.startsWith("blob:"))
            void decoding.catch(() => {
              document.documentElement.setAttribute(
                "data-pdf-native-decode-rejected",
                "true",
              )
            })

          return decoding
        }

        const descriptor = Object.getOwnPropertyDescriptor(
          HTMLImageElement.prototype,
          "src",
        )

        if (!descriptor?.set)
          throw new Error("Native image src setter is required.")
        Object.defineProperty(HTMLImageElement.prototype, "src", {
          ...descriptor,
          set(this: HTMLImageElement, value: string) {
            if (value.startsWith("blob:"))
              this.addEventListener(
                "error",
                () => {
                  document.documentElement.setAttribute(
                    "data-pdf-native-image-error",
                    "true",
                  )
                },
                { once: true },
              )
            descriptor.set?.call(this, value)
          },
        })
      }

      HTMLCanvasElement.prototype.toBlob = function rejectCapture(
        callback,
        type,
        quality,
      ) {
        if (type === "image/jpeg")
          document.documentElement.setAttribute(
            "data-pdf-jpeg-attempted",
            "true",
          )

        if (!failing) return toBlob.call(this, callback, type, quality)

        if ((kind === "decode" || kind === "crc") && type === "image/png") {
          const bytes = Uint8Array.from(
            atob(this.toDataURL("image/png").split(",")[1] ?? ""),
            (character) => character.charCodeAt(0),
          )

          if (kind === "crc") bytes[32] = (bytes[32] ?? 0) ^ 1
          document.documentElement.setAttribute(
            "data-pdf-captured-png",
            btoa(String.fromCharCode(...bytes)),
          )

          return callback(new Blob([bytes], { type: "image/png" }))
        }

        if (kind === "invalid-png" && type === "image/png")
          return callback(new Blob(["invalid"], { type: "image/png" }))

        if (kind === "oversized" && type === "image/png")
          return callback(
            new Blob([new Uint8Array(16_777_217)], { type: "image/png" }),
          )

        if (kind === "dimensions" && type === "image/png") {
          const wrongSize = document.createElement("canvas")
          wrongSize.width = 1
          wrongSize.height = 1

          return toBlob.call(wrongSize, callback, type, quality)
        }

        if (kind === "jpeg" && type === "image/jpeg") return callback(null)
        toBlob.call(this, callback, type, quality)
      }
    }, failure)
    const { controls, editor, exportButton } = await openPDF(page)
    const state = await preparePDFState(page, editor)
    const downloads: string[] = []
    page.on("download", (download) =>
      downloads.push(download.suggestedFilename()),
    )
    await exportButton.click()
    await expect(controls.getByRole("alert")).toBeVisible()
    await expect(exportButton).toBeEnabled()
    await expect(controls).toHaveAttribute("aria-busy", "false")
    expect(await editor.innerText()).toBe(state.before)
    expect(await readPDFSelection(page)).toEqual(state.selection)
    expect(downloads).toEqual([])
    await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)

    if (failure === "decode") {
      const serialized = await page
        .locator("html")
        .getAttribute("data-pdf-captured-png")

      expect(serialized).not.toBeNull()
      const bytes = Uint8Array.from(Buffer.from(serialized ?? "", "base64"))
      const view = new DataView(bytes.buffer)

      const dimensions = {
        width: view.getUint32(16),
        height: view.getUint32(20),
      }

      const blob = new Blob([bytes], { type: "image/png" })
      await expect(
        assertEditorDocumentExportPNG(
          blob,
          {
            signal: new AbortController().signal,
            deadlineAt: Date.now() + 30_000,
          },
          dimensions,
        ),
      ).resolves.toBe(blob)
      await expect(page.locator("html")).toHaveAttribute(
        "data-pdf-native-image-error",
        "true",
      )
      await expect(page.locator("html")).toHaveAttribute(
        "data-pdf-native-decode-rejected",
        "true",
      )
      await expect(page.locator("html")).toHaveAttribute(
        "data-pdf-source-revoked",
        "true",
      )
      await expect(page.locator("html")).toHaveAttribute(
        "data-pdf-source-cleaned",
        "true",
      )
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-pdf-jpeg-attempted",
      )
      await testInfo.attach("native-image-source-failure", {
        body: JSON.stringify({
          bytes: Array.from(bytes),
          dimensions,
          framingAndCRCs: "accepted",
          sourceFailure: "revoked object URL",
          sourceCleaned: true,
          nativeImageError: true,
          nativeDecodeRejected: true,
        }),
        contentType: "application/json",
      })
    }

    await verifyPDFHistory(editor, state)
    await testInfo.attach("rejected-pdf", {
      body: JSON.stringify({
        failure,
        downloads,
        before: state.before,
        after: await editor.innerText(),
        selection: state.selection,
      }),
      contentType: "application/json",
    })
    await page.evaluate(() =>
      window.dispatchEvent(new Event("restore-pdf-capture")),
    )
    const recoveredContent = await editor.innerText()
    await editor.press("ControlOrMeta+a")
    const recoveredSelection = await readPDFSelection(page)
    expect(recoveredSelection.text).toBe(recoveredContent)
    const recoveredDownload = page.waitForEvent("download")
    await exportButton.click()
    const download = await recoveredDownload
    const path = testInfo.outputPath(`${failure}-recovery.pdf`)
    await download.saveAs(path)
    expect(await download.failure()).toBeNull()
    expect(downloads).toEqual(["plate.pdf"])
    expect(await editor.innerText()).toBe(recoveredContent)
    expect(await readPDFSelection(page)).toEqual(recoveredSelection)
    await verifyPDFHistory(editor, state)
    await expect(controls).toHaveAttribute("aria-busy", "false")
    await expect(page.locator("[data-editor-export-host]")).toHaveCount(0)
    await testInfo.attach("recovered-pdf", {
      path,
      contentType: "application/pdf",
    })
  })
}

test("optional PDF item stays separate from print and capture SDK", async ({
  request,
}, testInfo) => {
  const response = await request.get("/r/editor-document-export-pdf.json")
  expect(response.ok()).toBe(true)
  const item: unknown = await response.json()

  const apiResponse = await request.get(
    "/r/docs/editor-document-export-pdf.json",
  )

  expect(apiResponse.ok()).toBe(true)
  const api: unknown = await apiResponse.json()
  expect(api).toMatchObject({
    parts: expect.arrayContaining([
      expect.objectContaining({
        name: "EditorDocumentPDFExportControl",
        importPath: "@/components/editor/document-export-pdf",
      }),
    ]),
  })
  await testInfo.attach("pdf-registry-item", {
    body: JSON.stringify({ item, api }),
    contentType: "application/json",
  })
  expect(item).toMatchObject({
    name: "editor-document-export-pdf",
    dependencies: [],
    registryDependencies: ["editor-document-export"],
  })
  const base = await request.get("/r/editor-document-export.json")
  const source: unknown = await base.json()
  expect(source).not.toMatchObject({
    registryDependencies: expect.arrayContaining([
      "editor-document-export-pdf",
    ]),
  })
})
