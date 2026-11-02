import { sanitizeEditorDiagramSvg } from "@editor/diagram-render"
import {
  assertEditorDrawingExportActive,
  assertEditorDrawingExportPNG,
  beginEditorDrawingExport,
  editorDrawingExportLimits,
  observeEditorDrawingSdkControlNames,
  removeEmptyEditorDrawingSvgMetadata,
  validateEditorDrawingExportDimensions,
  validateEditorDrawingJSON,
  waitForEditorDrawingExport,
} from "@editor/drawing-export-model"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { expect, test } from "bun:test"
import { parseHTML } from "linkedom"

function operation(signal = new AbortController().signal) {
  return {
    signal,
    deadlineAt: Date.now() + editorDrawingExportLimits.maxDurationMs,
  }
}

function deferred<Value>() {
  let resolvePromise: ((value: Value | PromiseLike<Value>) => void) | null =
    null

  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve
  })

  function resolve(value: Value | PromiseLike<Value>) {
    if (!resolvePromise) throw new Error("Deferred promise is not initialized.")
    resolvePromise(value)
  }

  return { promise, resolve }
}

function expectExportError<Value>(work: Promise<Value>, code: string) {
  return work.then(
    () => {
      throw new Error(`Expected drawing export to reject with code ${code}.`)
    },
    (error: Error & { code?: string }) => {
      expect(error).toMatchObject({ code })
    },
  )
}

function pngBlob(width: number, height: number) {
  const bytes = new Uint8Array(24)
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10])
  const view = new DataView(bytes.buffer)
  view.setUint32(8, 13)
  bytes.set([73, 72, 68, 82], 12)
  view.setUint32(16, width)
  view.setUint32(20, height)

  return new Blob([bytes], { type: "image/png" })
}

const validLocalJSON = JSON.stringify({
  type: "excalidraw",
  version: 2,
  source: "yopem-ui",
  elements: [{ id: "rectangle-1", type: "rectangle" }],
  appState: { name: null },
  files: {},
})

const svgNamespace = "http://www.w3.org/2000/svg"

function createSvgElement(document: Document) {
  const svg = document.createElementNS(svgNamespace, "svg")
  svg.setAttribute("xmlns", svgNamespace)

  return svg
}

test("removes only Excalidraw's empty root metadata before SVG sanitization", () => {
  withDOM((window) => {
    const svg = createSvgElement(window.document)
    const metadata = window.document.createElementNS(svgNamespace, "metadata")
    const rectangle = window.document.createElementNS(svgNamespace, "rect")
    rectangle.setAttribute("width", "24")
    rectangle.setAttribute("height", "24")
    svg.append(metadata, rectangle)

    expect(() => sanitizeEditorDiagramSvg(svg.outerHTML)).toThrow()

    removeEmptyEditorDrawingSvgMetadata(svg)

    const safeSvg = sanitizeEditorDiagramSvg(svg.outerHTML)

    expect(safeSvg).toContain("<rect")
    expect(safeSvg).not.toContain("<metadata")
  })
})

test("keeps nonempty or attributed SVG metadata and other unsafe content rejected", () => {
  withDOM((window) => {
    const svg = createSvgElement(window.document)
    const metadata = window.document.createElementNS(svgNamespace, "metadata")
    metadata.append(window.document.createTextNode("scene payload"))
    svg.append(metadata)

    removeEmptyEditorDrawingSvgMetadata(svg)

    expect(svg.contains(metadata)).toBe(true)
    expect(() => sanitizeEditorDiagramSvg(svg.outerHTML)).toThrow()

    const attributedSvg = createSvgElement(window.document)

    const attributedMetadata = window.document.createElementNS(
      svgNamespace,
      "metadata",
    )

    attributedMetadata.setAttribute("id", "unexpected")
    attributedSvg.append(attributedMetadata)

    removeEmptyEditorDrawingSvgMetadata(attributedSvg)

    expect(attributedSvg.contains(attributedMetadata)).toBe(true)
    expect(() => sanitizeEditorDiagramSvg(attributedSvg.outerHTML)).toThrow()

    const unsafeSvg = createSvgElement(window.document)
    const link = window.document.createElementNS(svgNamespace, "a")
    link.setAttribute("href", "https://example.test")
    unsafeSvg.append(link)

    removeEmptyEditorDrawingSvgMetadata(unsafeSvg)

    expect(() => sanitizeEditorDiagramSvg(unsafeSvg.outerHTML)).toThrow()
  })
})

test("names only unnamed SDK controls, tracks zoom text, and cleans up observation", async () => {
  const { document } = parseHTML("<!doctype html><html><body></body></html>")
  const root = document.createElement("div")
  const menu = document.createElement("button")
  menu.setAttribute("data-testid", "main-menu-trigger")
  const namedMenu = document.createElement("button")
  namedMenu.setAttribute("data-testid", "main-menu-trigger")
  namedMenu.setAttribute("aria-label", "Custom menu")
  const resetZoom = document.createElement("button")
  resetZoom.className = "reset-zoom-button"
  resetZoom.setAttribute("title", "Reset zoom")
  resetZoom.setAttribute("aria-label", "Reset zoom")
  resetZoom.textContent = "100%"
  const outsideMenu = document.createElement("button")
  outsideMenu.setAttribute("data-testid", "main-menu-trigger")
  root.append(menu, namedMenu, resetZoom)
  document.body.append(root, outsideMenu)

  let clicked = false
  menu.addEventListener("click", () => {
    clicked = true
  })

  const cleanup = observeEditorDrawingSdkControlNames(root)

  expect(menu.getAttribute("aria-label")).toBe("Open Excalidraw main menu")
  expect(menu.textContent).toBe("")
  expect(namedMenu.getAttribute("aria-label")).toBe("Custom menu")
  expect(resetZoom.getAttribute("aria-label")).toBe("Reset zoom 100%")
  expect(outsideMenu.hasAttribute("aria-label")).toBe(false)

  menu.click()
  expect(clicked).toBe(true)

  resetZoom.textContent = "175%"
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  expect(resetZoom.getAttribute("aria-label")).toBe("Reset zoom 175%")

  cleanup()
  resetZoom.textContent = "200%"
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  expect(resetZoom.getAttribute("aria-label")).toBe("Reset zoom 175%")
})

test("caps raster dimensions before export allocation and keeps aspect ratio", () => {
  expect(validateEditorDrawingExportDimensions(5000, 1000)).toMatchObject({
    width: 4096,
    height: 819,
  })
  expect(validateEditorDrawingExportDimensions(1000, 20_000)).toMatchObject({
    width: 819,
    height: 16_384,
  })

  const maximumSquare = validateEditorDrawingExportDimensions(
    Number.MAX_VALUE,
    Number.MAX_VALUE,
  )

  expect(maximumSquare.width).toBe(4096)
  expect(maximumSquare.height).toBe(4096)
  expect(maximumSquare.width * maximumSquare.height).toBeLessThanOrEqual(
    editorDrawingExportLimits.maxPixels,
  )
})

test.each([
  [0, 1],
  [-1, 1],
  [Number.NaN, 1],
  [1, Number.POSITIVE_INFINITY],
])("rejects invalid raster dimensions %j", (width, height) => {
  expect(() => validateEditorDrawingExportDimensions(width, height)).toThrow()
})

test("validates SDK JSON exports and rejects unsupported scene data", () => {
  expect(validateEditorDrawingJSON(validLocalJSON)).toBe(validLocalJSON)

  for (const element of [
    { id: "image-1", type: "image", fileId: "file-1" },
    { id: "custom-1", type: "rectangle", customData: { secret: "value" } },
    { id: "link-1", type: "rectangle", link: "https://example.test" },
  ]) {
    const source = JSON.stringify({
      type: "excalidraw",
      version: 2,
      elements: [element],
      files: {},
    })

    expect(() => validateEditorDrawingJSON(source)).toThrow()
  }

  expect(() =>
    validateEditorDrawingJSON(
      JSON.stringify({
        type: "excalidraw",
        version: 2,
        elements: [{ id: "rectangle-1", type: "rectangle" }],
        files: { "file-1": { dataURL: "data:image/png;base64,AA==" } },
      }),
    ),
  ).toThrow()
})

test("rejects oversized SDK JSON even when its scene is small", () => {
  const source = JSON.stringify({
    type: "excalidraw",
    version: 2,
    elements: [{ id: "rectangle-1", type: "rectangle" }],
    appState: { name: "x".repeat(editorDrawingExportLimits.maxOutputBytes) },
    files: {},
  })

  expect(() => validateEditorDrawingJSON(source)).toThrow()
})

test("accepts bounded PNG bytes only when signature and dimensions match", async () => {
  const blob = pngBlob(4, 3)

  const output = await assertEditorDrawingExportPNG(blob, operation(), {
    width: 4,
    height: 3,
  })

  expect(output).toBe(blob)

  await expectExportError(
    assertEditorDrawingExportPNG(blob, operation(), { width: 3, height: 4 }),
    "png",
  )

  const wrongSignature = new Blob([new Uint8Array(24)], {
    type: "image/png",
  })

  await expectExportError(
    assertEditorDrawingExportPNG(wrongSignature, operation(), {
      width: 4,
      height: 3,
    }),
    "png",
  )
})

test("rejects oversized PNG before reading bytes", async () => {
  const blob = pngBlob(1, 1)
  let read = false
  Object.defineProperty(blob, "size", {
    value: editorDrawingExportLimits.maxOutputBytes + 1,
  })
  Object.defineProperty(blob, "arrayBuffer", {
    value() {
      read = true
      throw new Error("Oversized PNG must not be read")
    },
  })

  await expectExportError(
    assertEditorDrawingExportPNG(blob, operation(), { width: 1, height: 1 }),
    "png",
  )
  expect(read).toBe(false)
})

test("bounds export time and rejects aborts even when SDK work later fails", async () => {
  const controller = new AbortController()
  const lease = beginEditorDrawingExport(operation(controller.signal))
  const work = deferred<string>()
  const tracked = lease.track(work.promise)
  const waiting = waitForEditorDrawingExport(tracked, lease)

  lease.finish()
  controller.abort()
  await expectExportError(waiting, "aborted")
  expect(() => beginEditorDrawingExport(operation())).toThrow()

  work.resolve(Promise.reject(new Error("late SDK failure")))
  await work.promise.catch(() => undefined)
  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  const nextLease = beginEditorDrawingExport(operation())
  nextLease.finish()
})

test("rejects already expired export operations", () => {
  const expired = operation()
  expired.deadlineAt = Date.now() - 1

  expect(() => assertEditorDrawingExportActive(expired)).toThrow()
  expect(() => beginEditorDrawingExport(expired)).toThrow()
})
