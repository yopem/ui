import { crc32 } from "@editor/checksum"
import {
  assertEditorDocumentExportPNG,
  beginEditorDocumentExport,
  editorDocumentExportLimits,
  type EditorDocumentExportError,
} from "@editor/document-export-model"
import { expect, test } from "bun:test"

const png = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
    "base64",
  ),
)

const signature = png.slice(0, 8)

const dimensions = { width: 1, height: 1 }

const originalChunks = readChunks(png)

function operation(signal = new AbortController().signal) {
  return {
    signal,
    deadlineAt: Date.now() + editorDocumentExportLimits.maxDurationMs,
  }
}

function readChunks(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunks: Uint8Array[] = []

  for (let offset = 8; offset < bytes.byteLength;) {
    if (offset + 8 > bytes.byteLength)
      throw new Error("PNG fixture has a truncated chunk header.")

    const length = view.getUint32(offset)
    const end = offset + length + 12

    if (end > bytes.byteLength)
      throw new Error("PNG fixture has a truncated chunk body.")

    chunks.push(bytes.slice(offset, end))
    offset = end
  }

  return chunks
}

function chunkType(chunk: Uint8Array) {
  return String.fromCharCode(...chunk.subarray(4, 8))
}

function findChunk(chunks: readonly Uint8Array[], type: string) {
  const chunk = chunks.find((value) => chunkType(value) === type)

  if (!chunk) throw new Error(`PNG fixture has no ${type} chunk.`)

  return chunk
}

function createChunk(type: string, data: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type)
  const checksumInput = new Uint8Array(typeBytes.byteLength + data.byteLength)
  checksumInput.set(typeBytes)
  checksumInput.set(data, typeBytes.byteLength)

  const chunk = new Uint8Array(data.byteLength + 12)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, data.byteLength)
  chunk.set(typeBytes, 4)
  chunk.set(data, 8)
  view.setUint32(chunk.byteLength - 4, crc32(checksumInput))

  return chunk
}

function assemble(chunks: readonly Uint8Array[]) {
  const result = new Uint8Array(
    signature.byteLength +
      chunks.reduce((length, chunk) => length + chunk.byteLength, 0),
  )

  result.set(signature)

  let offset = signature.byteLength

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }

  return result
}

function withBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)

  return new Blob([copy], { type: "image/png" })
}

function expectExportFailure<Value>(work: Promise<Value>, code: string) {
  return work.then(
    () => {
      throw new Error(`Expected export to reject with code ${code}.`)
    },
    (error: EditorDocumentExportError) => {
      expect(error).toMatchObject({ code })
    },
  )
}

function expectPNGRejection(bytes: Uint8Array) {
  return expectExportFailure(
    assertEditorDocumentExportPNG(withBlob(bytes), operation(), dimensions),
    "png",
  )
}

test("accepts a genuine PNG with valid chunks and matching dimensions", async () => {
  const blob = withBlob(png)

  const result = await assertEditorDocumentExportPNG(
    blob,
    operation(),
    dimensions,
  )

  expect(result).toBe(blob)
})

test("rejects truncated chunk framing and invalid chunk CRCs", async () => {
  const truncated = png.slice(0, png.byteLength - 1)
  const idat = findChunk(originalChunks, "IDAT").slice()
  idat[idat.byteLength - 1] = (idat[idat.byteLength - 1] ?? 0) ^ 1

  const invalidCRC = originalChunks.map((chunk) =>
    chunkType(chunk) === "IDAT" ? idat : chunk,
  )

  await expectPNGRejection(truncated)
  await expectPNGRejection(assemble(invalidCRC))
})

test("rejects PNGs with no IDAT chunk", async () => {
  const withoutIDAT = originalChunks.filter(
    (chunk) => chunkType(chunk) !== "IDAT",
  )

  await expectPNGRejection(assemble(withoutIDAT))
})

test("rejects nonconsecutive IDAT chunks and invalid IHDR formats", async () => {
  const ihdr = findChunk(originalChunks, "IHDR")
  const idatData = findChunk(originalChunks, "IDAT").subarray(8, -4)
  const split = Math.floor(idatData.byteLength / 2)
  const firstIDAT = createChunk("IDAT", idatData.subarray(0, split))
  const secondIDAT = createChunk("IDAT", idatData.subarray(split))
  const text = createChunk("tEXt", new TextEncoder().encode("key\0value"))
  const iend = findChunk(originalChunks, "IEND")
  const nonconsecutiveIDAT = assemble([ihdr, firstIDAT, text, secondIDAT, iend])

  const ihdrData = ihdr.slice(8, -4)
  ihdrData.set([3], 8)

  const invalidIHDR = assemble([
    createChunk("IHDR", ihdrData),
    ...originalChunks.slice(1),
  ])

  await expectPNGRejection(nonconsecutiveIDAT)

  await expectPNGRejection(invalidIHDR)
})

test("rejects unsupported critical chunks and animated PNG chunks", async () => {
  const ihdr = findChunk(originalChunks, "IHDR")
  const idat = findChunk(originalChunks, "IDAT")
  const iend = findChunk(originalChunks, "IEND")
  const critical = createChunk("ABCD", new Uint8Array())
  const animationData = new Uint8Array(8)
  new DataView(animationData.buffer).setUint32(0, 1)
  const animation = createChunk("acTL", animationData)

  await expectPNGRejection(assemble([ihdr, critical, idat, iend]))

  await expectPNGRejection(assemble([ihdr, animation, idat, iend]))
})

test("rejects dimension mismatch and bytes after IEND", async () => {
  const trailing = new Uint8Array(png.byteLength + 1)
  trailing.set(png)

  await expectExportFailure(
    assertEditorDocumentExportPNG(withBlob(png), operation(), {
      width: 2,
      height: 1,
    }),
    "png",
  )
  await expectPNGRejection(trailing)
})

test("cancellation rejects a pending PNG read and keeps the export lease busy", async () => {
  const controller = new AbortController()
  const currentOperation = operation(controller.signal)

  let resolveRead: ((value: ArrayBuffer) => void) | undefined

  const pendingRead = new Promise<ArrayBuffer>((resolve) => {
    resolveRead = resolve
  })

  const blob = withBlob(png)
  Object.defineProperty(blob, "arrayBuffer", { value: () => pendingRead })

  const lease = beginEditorDocumentExport(currentOperation)

  const validation = lease.track(
    assertEditorDocumentExportPNG(blob, lease, dimensions),
  )

  lease.finish()
  controller.abort()

  await expectExportFailure(validation, "aborted")
  expect(() => beginEditorDocumentExport(operation())).toThrow()

  if (!resolveRead) throw new Error("PNG read promise was not initialized.")
  resolveRead(await withBlob(png).arrayBuffer())
  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  const nextLease = beginEditorDocumentExport(operation())
  nextLease.finish()
})
