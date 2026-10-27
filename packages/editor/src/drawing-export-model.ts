import { z } from "zod"

import { parseEditorDrawingScene } from "./drawing-model"

export const editorDrawingExportLimits = Object.freeze({
  maxWidth: 4096,
  maxHeight: 16_384,
  maxPixels: 16_777_216,
  maxOutputBytes: 16_777_216,
  maxDurationMs: 30_000,
})

export function removeEmptyEditorDrawingSvgMetadata(svg: SVGSVGElement) {
  const metadata = Array.from(svg.children).find(
    (element) =>
      element.namespaceURI === svg.namespaceURI &&
      element.localName === "metadata" &&
      element.attributes.length === 0 &&
      element.childNodes.length === 0,
  )

  metadata?.remove()
}

export function observeEditorDrawingSdkControlNames(root: HTMLElement) {
  const ownerWindow = root.ownerDocument.defaultView

  if (!ownerWindow) return () => undefined

  function labelControls() {
    const menu = root.querySelector<HTMLButtonElement>(
      'button[data-testid="main-menu-trigger"]',
    )

    if (
      menu &&
      !menu.getAttribute("aria-label")?.trim() &&
      !menu.getAttribute("aria-labelledby")?.trim() &&
      !menu.title.trim() &&
      !menu.textContent?.trim()
    )
      menu.setAttribute("aria-label", "Open Excalidraw main menu")

    const resetZoom = root.querySelector<HTMLButtonElement>(
      "button.reset-zoom-button",
    )

    const visibleLabel = resetZoom?.textContent?.trim()
    const ariaLabel = resetZoom?.getAttribute("aria-label")?.trim()

    if (!resetZoom || !visibleLabel || !ariaLabel) return

    const baseLabel = ariaLabel.replace(/\s+\d+(?:\.\d+)?%$/u, "").trim()
    const nextLabel = `${baseLabel} ${visibleLabel}`

    if (baseLabel && ariaLabel !== nextLabel)
      resetZoom.setAttribute("aria-label", nextLabel)
  }

  labelControls()

  const observer = new ownerWindow.MutationObserver(labelControls)

  observer.observe(root, {
    attributes: true,
    attributeFilter: ["aria-label", "aria-labelledby", "title"],
    characterData: true,
    childList: true,
    subtree: true,
  })

  return () => observer.disconnect()
}

export type EditorDrawingExportErrorCode =
  | "aborted"
  | "busy"
  | "deadline"
  | "dimensions"
  | "json"
  | "png"
  | "output"

export class EditorDrawingExportError extends Error {
  constructor(
    readonly code: EditorDrawingExportErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "EditorDrawingExportError"
  }
}

export interface EditorDrawingExportOperation {
  readonly signal: AbortSignal
  readonly deadlineAt: number
}

export interface EditorDrawingExportLease extends EditorDrawingExportOperation {
  readonly whenIdle: Promise<void>
  finish(): void
  track<Value>(work: Promise<Value>): Promise<Value>
}

interface ActiveExportLease {
  pending: number
  finishing: boolean
  resolveIdle(): void
  readonly signal: AbortSignal
  readonly deadlineAt: number
  readonly whenIdle: Promise<void>
}

let activeLease: ActiveExportLease | null = null

const exportJSONSchema = z.object({
  elements: z.array(z.record(z.string(), z.json())),
  files: z.record(z.string(), z.json()).optional(),
})

function exportError(
  code: EditorDrawingExportErrorCode,
  message: string,
): EditorDrawingExportError {
  return new EditorDrawingExportError(code, message)
}

export function createEditorDrawingExportDeferred<Value>() {
  let resolvePromise!: (value: Value | PromiseLike<Value>) => void
  let rejectPromise!: (reason: Error) => void

  const promise = new Promise<Value>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = (reason) => reject(reason)
  })

  return { promise, resolve: resolvePromise, reject: rejectPromise }
}

function releaseIfReady(lease: ActiveExportLease) {
  if (lease.finishing && lease.pending === 0 && activeLease === lease) {
    activeLease = null
    lease.resolveIdle()
  }
}

function trackLeaseWork<Value>(work: Promise<Value>, lease: ActiveExportLease) {
  lease.pending += 1

  function release() {
    lease.pending -= 1
    releaseIfReady(lease)
  }

  void work.then(release, release)
}

export function validateEditorDrawingExportDimensions(
  width: number,
  height: number,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw exportError("dimensions", "Drawing is too large for PNG export.")

  const axisScale = Math.min(
    1,
    editorDrawingExportLimits.maxWidth / width,
    editorDrawingExportLimits.maxHeight / height,
  )

  const scaledWidth = width * axisScale

  const scaledHeight = height * axisScale

  const pixelScale = Math.min(
    1,
    Math.sqrt(
      editorDrawingExportLimits.maxPixels / (scaledWidth * scaledHeight),
    ),
  )

  const scale = axisScale * pixelScale

  const dimensions = {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  }

  if (
    !Number.isSafeInteger(dimensions.width) ||
    !Number.isSafeInteger(dimensions.height) ||
    dimensions.width > editorDrawingExportLimits.maxWidth ||
    dimensions.height > editorDrawingExportLimits.maxHeight ||
    dimensions.width * dimensions.height > editorDrawingExportLimits.maxPixels
  )
    throw exportError("dimensions", "Drawing is too large for PNG export.")

  return { ...dimensions, scale }
}

export function validateEditorDrawingJSON(source: string) {
  if (
    !source ||
    new TextEncoder().encode(source).byteLength >
      editorDrawingExportLimits.maxOutputBytes
  )
    throw exportError("json", "Drawing JSON exceeds the export size limit.")

  let data: z.infer<typeof exportJSONSchema>

  try {
    data = exportJSONSchema.parse(JSON.parse(source))
  } catch {
    throw exportError("json", "Drawing JSON could not be validated.")
  }

  if (data.files && Object.keys(data.files).length > 0)
    throw exportError("json", "Drawing JSON cannot contain scene files.")

  try {
    parseEditorDrawingScene({ elements: data.elements })
  } catch {
    throw exportError("json", "Drawing JSON contains unsupported scene data.")
  }

  return source
}

export function assertEditorDrawingExportActive(
  operation: EditorDrawingExportOperation,
) {
  if (operation.signal.aborted)
    throw exportError("aborted", "Drawing export was cancelled.")

  const remaining = operation.deadlineAt - Date.now()

  if (!Number.isSafeInteger(operation.deadlineAt) || remaining <= 0)
    throw exportError("deadline", "Drawing export reached its time limit.")

  if (remaining > editorDrawingExportLimits.maxDurationMs)
    throw exportError("deadline", "Drawing export time limit is invalid.")
}

export function waitForEditorDrawingExport<Value>(
  work: Promise<Value>,
  operation: EditorDrawingExportOperation,
) {
  return new Promise<Value>((resolve, reject) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function cleanup() {
      if (timer !== undefined) clearTimeout(timer)
      operation.signal.removeEventListener("abort", onAbort)
    }

    function finish(action: () => void) {
      if (settled) return
      settled = true
      cleanup()
      action()
    }

    function onAbort() {
      finish(() =>
        reject(exportError("aborted", "Drawing export was cancelled.")),
      )
    }

    work.then(
      (value) => {
        try {
          assertEditorDrawingExportActive(operation)
          finish(() => resolve(value))
        } catch (error) {
          finish(() =>
            reject(
              error instanceof Error
                ? error
                : exportError("output", "Drawing export work failed."),
            ),
          )
        }
      },
      (error: Error) =>
        finish(() =>
          reject(
            error instanceof Error
              ? error
              : exportError("output", "Drawing export work failed."),
          ),
        ),
    )

    try {
      assertEditorDrawingExportActive(operation)
      const remaining = operation.deadlineAt - Date.now()
      timer = setTimeout(
        () =>
          finish(() =>
            reject(
              exportError("deadline", "Drawing export reached its time limit."),
            ),
          ),
        remaining,
      )
      operation.signal.addEventListener("abort", onAbort, { once: true })

      if (operation.signal.aborted) onAbort()
    } catch (error) {
      finish(() =>
        reject(
          error instanceof Error
            ? error
            : exportError("output", "Drawing export work failed."),
        ),
      )
    }
  })
}

export function beginEditorDrawingExport(
  operation: EditorDrawingExportOperation,
): EditorDrawingExportLease {
  assertEditorDrawingExportActive(operation)

  if (activeLease)
    throw exportError("busy", "Another drawing export is still running.")

  let resolveIdle!: () => void

  const whenIdle = new Promise<void>((resolve) => {
    resolveIdle = resolve
  })

  const lease: ActiveExportLease = {
    pending: 0,
    finishing: false,
    resolveIdle,
    signal: operation.signal,
    deadlineAt: operation.deadlineAt,
    whenIdle,
  }

  activeLease = lease

  return {
    ...operation,
    whenIdle,
    finish() {
      lease.finishing = true
      releaseIfReady(lease)
    },
    track<Value>(work: Promise<Value>) {
      if (lease.finishing || activeLease !== lease)
        throw exportError("aborted", "Drawing export is no longer active.")

      trackLeaseWork(work, lease)

      return work
    },
  }
}

export async function assertEditorDrawingExportPNG(
  blob: Blob,
  operation: EditorDrawingExportOperation,
  expected: { readonly width: number; readonly height: number },
) {
  assertEditorDrawingExportActive(operation)

  if (
    blob.type.toLowerCase() !== "image/png" ||
    blob.size < 24 ||
    blob.size > editorDrawingExportLimits.maxOutputBytes
  )
    throw exportError(
      "png",
      "Drawing PNG is invalid or exceeds the size limit.",
    )

  const buffer = await waitForEditorDrawingExport(blob.arrayBuffer(), operation)
  const bytes = new Uint8Array(buffer)
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]

  if (
    bytes.byteLength !== blob.size ||
    !signature.every((byte, index) => bytes[index] === byte)
  )
    throw exportError("png", "Drawing PNG has an invalid header.")

  const view = new DataView(buffer)

  if (
    view.getUint32(8) !== 13 ||
    String.fromCharCode(...bytes.subarray(12, 16)) !== "IHDR" ||
    view.getUint32(16) !== expected.width ||
    view.getUint32(20) !== expected.height
  )
    throw exportError("png", "Drawing PNG dimensions do not match the export.")

  assertEditorDrawingExportActive(operation)

  return blob
}
