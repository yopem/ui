import { crc32 } from "./checksum"

export const editorDocumentExportLimits = Object.freeze({
  maxWidth: 4096,
  maxHeight: 16384,
  maxPixels: 16_777_216,
  maxResourceBytes: 2_097_152,
  maxTotalResourceBytes: 8_388_608,
  maxOutputBytes: 16_777_216,
  maxSvgBytes: 8_388_608,
  maxDocumentCharacters: 1_048_576,
  maxDocumentNodes: 25_000,
  maxResourceCount: 16,
  maxDurationMs: 30_000,
})

export type EditorDocumentExportErrorCode =
  | "aborted"
  | "busy"
  | "deadline"
  | "dimensions"
  | "document"
  | "png"
  | "popup"
  | "resource"
  | "resource-limit"
  | "svg"
  | "url"

export class EditorDocumentExportError extends Error {
  constructor(
    readonly code: EditorDocumentExportErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "EditorDocumentExportError"
  }
}

export function parseEditorDocumentExportFailure<Failure>(value: Failure) {
  if (value instanceof Error) return value

  return new EditorDocumentExportError(
    "document",
    "Document export work failed.",
  )
}

export interface EditorDocumentExportOperation {
  readonly signal: AbortSignal
  readonly deadlineAt: number
}

export interface EditorDocumentExportLease extends EditorDocumentExportOperation {
  finish(): void
  track<Value>(work: Promise<Value>): Promise<Value>
}

interface ActiveExportLease {
  pending: number
  finishing: boolean
  readonly signal: AbortSignal
  readonly deadlineAt: number
}

let activeLease: ActiveExportLease | null = null

function releaseIfReady(lease: ActiveExportLease) {
  if (lease.finishing && lease.pending === 0 && activeLease === lease)
    activeLease = null
}

function trackLeaseWork<Value>(work: Promise<Value>, lease: ActiveExportLease) {
  lease.pending += 1

  function release() {
    lease.pending -= 1
    releaseIfReady(lease)
  }

  void work.then(release, release)
}

function trackOperationWork<Value>(
  work: Promise<Value>,
  operation: EditorDocumentExportOperation,
) {
  const lease = activeLease

  if (
    lease &&
    lease.signal === operation.signal &&
    lease.deadlineAt === operation.deadlineAt
  )
    trackLeaseWork(work, lease)
}

export function validateEditorDocumentExportDimensions(
  width: number,
  height: number,
) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > editorDocumentExportLimits.maxWidth ||
    height > editorDocumentExportLimits.maxHeight ||
    width * height > editorDocumentExportLimits.maxPixels
  )
    throw new EditorDocumentExportError(
      "dimensions",
      "Document is too large for PNG export.",
    )

  return { width, height }
}

export function validateEditorDocumentExportURL(
  value: string,
  baseURL: string,
) {
  if (!value.trim())
    throw new EditorDocumentExportError(
      "url",
      "Document contains an invalid resource URL.",
    )

  let url: URL

  try {
    url = new URL(value, baseURL)
  } catch {
    throw new EditorDocumentExportError(
      "url",
      "Document contains an invalid resource URL.",
    )
  }

  const localHTTP =
    url.protocol === "http:" &&
    (url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]")

  if (
    (url.protocol !== "https:" && !localHTTP) ||
    url.username ||
    url.password ||
    /[?#]/.test(value) ||
    url.search ||
    url.hash
  )
    throw new EditorDocumentExportError(
      "url",
      "Document contains a resource URL that is not allowed.",
    )

  return url
}

export function validateEditorDocumentExportDataURL(value: string) {
  const match =
    /^data:(image\/(?:png|jpeg|webp|gif|avif));base64,([A-Za-z0-9+/]*={0,2})$/i.exec(
      value,
    )

  const payload = match?.[2]

  if (!match || !payload || payload.length % 4 !== 0)
    throw new EditorDocumentExportError(
      "resource",
      "Document contains an invalid embedded image.",
    )

  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0
  const byteLength = (payload.length / 4) * 3 - padding

  if (
    byteLength < 1 ||
    byteLength > editorDocumentExportLimits.maxResourceBytes
  )
    throw new EditorDocumentExportError(
      "resource-limit",
      "An embedded document image exceeds the export limit.",
    )

  return {
    mediaType: match[1]?.toLowerCase() ?? "",
    byteLength,
  }
}

export function assertEditorDocumentExportActive(
  operation: EditorDocumentExportOperation,
) {
  if (operation.signal.aborted)
    throw new EditorDocumentExportError("aborted", "Document export cancelled.")

  const remaining = operation.deadlineAt - Date.now()

  if (!Number.isFinite(operation.deadlineAt) || remaining <= 0)
    throw new EditorDocumentExportError(
      "deadline",
      "Document export reached its time limit.",
    )

  if (remaining > editorDocumentExportLimits.maxDurationMs)
    throw new EditorDocumentExportError(
      "deadline",
      "Document export time limit is invalid.",
    )
}

export function waitForEditorDocumentExport<Value>(
  work: Promise<Value>,
  operation: EditorDocumentExportOperation,
) {
  trackOperationWork(work, operation)
  const normalizedWork = work.catch(parseEditorDocumentExportFailure)

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
        reject(
          new EditorDocumentExportError(
            "aborted",
            "Document export cancelled.",
          ),
        ),
      )
    }

    normalizedWork.then(
      (value) => {
        try {
          assertEditorDocumentExportActive(operation)
          finish(() => resolve(value))
        } catch (error) {
          finish(() => reject(parseEditorDocumentExportFailure(error)))
        }
      },
      (error: Error) => finish(() => reject(error)),
    )

    try {
      assertEditorDocumentExportActive(operation)
      const remaining = operation.deadlineAt - Date.now()
      timer = setTimeout(() => {
        finish(() =>
          reject(
            new EditorDocumentExportError(
              "deadline",
              "Document export reached its time limit.",
            ),
          ),
        )
      }, remaining)
      operation.signal.addEventListener("abort", onAbort, { once: true })

      if (operation.signal.aborted) onAbort()
    } catch (error) {
      finish(() => reject(parseEditorDocumentExportFailure(error)))
    }
  })
}

export function waitForEditorDocumentExportWithCleanup<Value>(
  work: Promise<Value>,
  operation: EditorDocumentExportOperation,
  cleanup: (value: Value) => void,
) {
  let releaseCleanup: (() => void) | undefined

  const cleanupWork = new Promise<void>((resolve) => {
    releaseCleanup = resolve
  })

  trackOperationWork(cleanupWork, operation)

  return waitForEditorDocumentExport(work, operation).then(
    (value) => {
      releaseCleanup?.()

      return value
    },
    (error: Error) => {
      void work
        .then(
          (value) => {
            try {
              cleanup(value)
            } finally {
              releaseCleanup?.()
            }
          },
          () => releaseCleanup?.(),
        )
        .catch(() => undefined)
      throw error
    },
  )
}

export function beginEditorDocumentExport(
  operation: EditorDocumentExportOperation,
): EditorDocumentExportLease {
  assertEditorDocumentExportActive(operation)

  if (activeLease)
    throw new EditorDocumentExportError(
      "busy",
      "Another document export is still running.",
    )

  const lease: ActiveExportLease = {
    pending: 0,
    finishing: false,
    signal: operation.signal,
    deadlineAt: operation.deadlineAt,
  }

  activeLease = lease

  return {
    ...operation,
    finish() {
      lease.finishing = true
      releaseIfReady(lease)
    },
    track<Value>(work: Promise<Value>) {
      if (lease.finishing || activeLease !== lease)
        throw new EditorDocumentExportError(
          "aborted",
          "Document export is no longer active.",
        )

      trackLeaseWork(work, lease)

      return work
    },
  }
}

function isValidPNGHeader(view: DataView, offset: number) {
  const bitDepth = view.getUint8(offset + 8)
  const colorType = view.getUint8(offset + 9)

  const validBitDepth =
    (colorType === 0 && [1, 2, 4, 8, 16].includes(bitDepth)) ||
    (colorType === 2 && [8, 16].includes(bitDepth)) ||
    (colorType === 3 && [1, 2, 4, 8].includes(bitDepth)) ||
    (colorType === 4 && [8, 16].includes(bitDepth)) ||
    (colorType === 6 && [8, 16].includes(bitDepth))

  return (
    validBitDepth &&
    view.getUint8(offset + 10) === 0 &&
    view.getUint8(offset + 11) === 0 &&
    view.getUint8(offset + 12) <= 1
  )
}

function isValidPNGChunkType(type: string) {
  return /^[A-Za-z]{4}$/.test(type) && type.charCodeAt(2) <= 90
}

function isValidPNG(
  bytes: Uint8Array,
  dimensions: { readonly width: number; readonly height: number },
) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]

  if (
    bytes.byteLength < 45 ||
    !signature.every((byte, index) => bytes[index] === byte)
  )
    return false

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = signature.length
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = -1
  let hasHeader = false
  let hasPalette = false
  let hasImageData = false
  let hasImageBytes = false
  let imageDataEnded = false
  let hasEnd = false

  while (offset < bytes.byteLength) {
    if (bytes.byteLength - offset < 12) return false

    const length = view.getUint32(offset)
    const dataOffset = offset + 8

    if (length > bytes.byteLength - offset - 12) return false

    const checksumOffset = dataOffset + length
    const type = String.fromCharCode(...bytes.subarray(offset + 4, dataOffset))
    const nextOffset = checksumOffset + 4

    if (
      !isValidPNGChunkType(type) ||
      crc32(bytes.subarray(offset + 4, checksumOffset)) !==
        view.getUint32(checksumOffset)
    )
      return false

    if (!hasHeader) {
      if (
        type !== "IHDR" ||
        length !== 13 ||
        !isValidPNGHeader(view, dataOffset)
      )
        return false

      width = view.getUint32(dataOffset)
      height = view.getUint32(dataOffset + 4)
      bitDepth = view.getUint8(dataOffset + 8)
      colorType = view.getUint8(dataOffset + 9)

      if (
        width === 0 ||
        height === 0 ||
        width > 0x7fffffff ||
        height > 0x7fffffff ||
        width !== dimensions.width ||
        height !== dimensions.height
      )
        return false

      hasHeader = true
      offset = nextOffset
      continue
    }

    if (type === "IHDR") return false

    if (type === "acTL" || type === "fcTL" || type === "fdAT") return false

    if (type === "PLTE") {
      if (
        hasPalette ||
        hasImageData ||
        colorType === 0 ||
        colorType === 4 ||
        length < 3 ||
        length > 768 ||
        length % 3 !== 0 ||
        (colorType === 3 && length / 3 > 2 ** bitDepth)
      )
        return false

      hasPalette = true
    } else if (type === "IDAT") {
      if (imageDataEnded || (colorType === 3 && !hasPalette)) return false

      hasImageData = true
      hasImageBytes ||= length > 0
    } else if (type === "IEND") {
      if (
        length !== 0 ||
        !hasImageData ||
        !hasImageBytes ||
        (colorType === 3 && !hasPalette) ||
        nextOffset !== bytes.byteLength
      )
        return false

      hasEnd = true
      offset = nextOffset
      break
    } else {
      if (hasImageData) imageDataEnded = true

      if (type.charCodeAt(0) >= 65 && type.charCodeAt(0) <= 90) return false
    }

    offset = nextOffset
  }

  return hasEnd && hasImageData && hasImageBytes && offset === bytes.byteLength
}

export async function assertEditorDocumentExportPNG(
  blob: Blob,
  operation: EditorDocumentExportOperation,
  dimensions: { readonly width: number; readonly height: number },
) {
  assertEditorDocumentExportActive(operation)

  if (
    blob.type !== "image/png" ||
    blob.size < 45 ||
    blob.size > editorDocumentExportLimits.maxOutputBytes
  )
    throw new EditorDocumentExportError(
      "png",
      "PNG export did not produce a valid bounded image.",
    )

  const bytes = new Uint8Array(
    await waitForEditorDocumentExport(blob.arrayBuffer(), operation),
  )

  if (!isValidPNG(bytes, dimensions))
    throw new EditorDocumentExportError(
      "png",
      "PNG export did not produce a valid bounded image.",
    )

  assertEditorDocumentExportActive(operation)

  return blob
}
