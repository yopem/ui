import { DocumentError } from "./document/boundary"
import { docxLimits } from "./docx-limits"

export interface ZipWriteEntry {
  name: string
  data: Uint8Array
  method?: 0 | 8
  compressedData?: Uint8Array
  flags?: number
}

interface ZipDirectoryEntry {
  name: string
  nameBytes: Uint8Array
  flags: number
  method: number
  crc: number
  compressedSize: number
  uncompressedSize: number
  localOffset: number
  endOffset: number
}

const crcTable = new Uint32Array(256)

for (let index = 0; index < crcTable.length; index++) {
  let value = index

  for (let bit = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  crcTable[index] = value >>> 0
}

function fail(message: string): never {
  throw new DocumentError([message])
}

function checkRange(offset: number, length: number, limit: number) {
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(length) ||
    offset < 0 ||
    length < 0 ||
    offset + length > limit
  )
    fail("Invalid DOCX ZIP range.")
}

function readU16(view: DataView, offset: number) {
  checkRange(offset, 2, view.byteLength)

  return view.getUint16(offset, true)
}

function readU32(view: DataView, offset: number) {
  checkRange(offset, 4, view.byteLength)

  return view.getUint32(offset, true)
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true)
}

function crc32(bytes: Uint8Array) {
  let value = 0xffffffff

  for (const byte of bytes)
    value = (value >>> 8) ^ (crcTable[(value ^ byte) & 0xff] ?? 0)

  return (value ^ 0xffffffff) >>> 0
}

function validateExtra(bytes: Uint8Array, offset: number, length: number) {
  const end = offset + length
  checkRange(offset, length, bytes.length)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  while (offset < end) {
    checkRange(offset, 4, end)
    const id = readU16(view, offset)
    const size = readU16(view, offset + 2)
    offset += 4
    checkRange(offset, size, end)

    if ([0x0001, 0x7075, 0x9901].includes(id))
      fail("Unsupported DOCX ZIP extra field.")
    offset += size
  }
}

function validateName(name: string, nameBytes: Uint8Array) {
  if (
    !name ||
    nameBytes.byteLength > docxLimits.entryNameBytes ||
    name.startsWith("/") ||
    name.includes("\\") ||
    name.includes("\0") ||
    name.includes(":") ||
    name.includes("%")
  )
    fail("Unsafe DOCX ZIP entry name.")

  const path = name.endsWith("/") ? name.slice(0, -1) : name
  const parts = path.split("/")

  if (parts.some((part) => !part || part === "." || part === ".."))
    fail("Unsafe DOCX ZIP entry path.")

  return `${path.normalize("NFC")}`.toLowerCase()
}

function findEndRecord(bytes: Uint8Array, view: DataView) {
  const start = Math.max(0, bytes.length - 65_557)

  for (let offset = bytes.length - 22; offset >= start; offset--) {
    if (readU32(view, offset) !== 0x06054b50) continue

    const commentLength = readU16(view, offset + 20)

    if (offset + 22 + commentLength === bytes.length) return offset
  }

  return fail("Invalid DOCX ZIP end record.")
}

function scanDirectory(
  bytes: Uint8Array,
  view: DataView,
  endRecord: number,
): ZipDirectoryEntry[] {
  const diskNumber = readU16(view, endRecord + 4)
  const centralDisk = readU16(view, endRecord + 6)
  const diskEntries = readU16(view, endRecord + 8)
  const totalEntries = readU16(view, endRecord + 10)
  const centralSize = readU32(view, endRecord + 12)
  const centralOffset = readU32(view, endRecord + 16)

  if (
    diskNumber !== 0 ||
    centralDisk !== 0 ||
    diskEntries !== totalEntries ||
    totalEntries === 0 ||
    totalEntries > docxLimits.entries ||
    centralOffset + centralSize !== endRecord
  )
    fail("Unsupported or invalid DOCX ZIP directory.")

  const entries: ZipDirectoryEntry[] = []
  const seen = new Set<string>()
  let offset = centralOffset
  let uncompressedTotal = 0
  let compressedTotal = 0

  for (let index = 0; index < totalEntries; index++) {
    checkRange(offset, 46, endRecord)

    if (readU32(view, offset) !== 0x02014b50)
      fail("Invalid DOCX ZIP directory entry.")

    const version = readU16(view, offset + 6)
    const flags = readU16(view, offset + 8)
    const method = readU16(view, offset + 10)
    const crc = readU32(view, offset + 16)
    const compressedSize = readU32(view, offset + 20)
    const uncompressedSize = readU32(view, offset + 24)
    const nameLength = readU16(view, offset + 28)
    const extraLength = readU16(view, offset + 30)
    const commentLength = readU16(view, offset + 32)
    const diskStart = readU16(view, offset + 34)
    const localOffset = readU32(view, offset + 42)
    const recordLength = 46 + nameLength + extraLength + commentLength

    checkRange(offset, recordLength, endRecord)

    if (
      version > 20 ||
      diskStart !== 0 ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localOffset === 0xffffffff ||
      commentLength !== 0 ||
      (flags & 1) !== 0 ||
      (flags & ~(0x0006 | 0x0008 | 0x0800)) !== 0 ||
      (method !== 0 && method !== 8) ||
      (method === 0 && (flags & 0x0006) !== 0)
    )
      fail("Unsupported DOCX ZIP entry features.")

    const nameBytes = bytes.slice(offset + 46, offset + 46 + nameLength)

    if (!(flags & 0x0800) && nameBytes.some((byte) => byte > 0x7f))
      fail("DOCX ZIP entry name is not UTF-8.")

    let name: string

    try {
      name = new TextDecoder("utf-8", { fatal: true }).decode(nameBytes)
    } catch {
      fail("Invalid DOCX ZIP entry name encoding.")
    }

    const normalizedName = validateName(name, nameBytes)

    if (seen.has(normalizedName)) fail("Duplicate DOCX ZIP entry name.")
    seen.add(normalizedName)
    validateExtra(bytes, offset + 46 + nameLength, extraLength)

    const localOffsetValue = localOffset
    checkRange(localOffsetValue, 30, centralOffset)

    if (readU32(view, localOffsetValue) !== 0x04034b50)
      fail("Invalid DOCX ZIP local entry.")

    const localFlags = readU16(view, localOffsetValue + 6)
    const localMethod = readU16(view, localOffsetValue + 8)
    const localCrc = readU32(view, localOffsetValue + 14)
    const localCompressedSize = readU32(view, localOffsetValue + 18)
    const localUncompressedSize = readU32(view, localOffsetValue + 22)
    const localNameLength = readU16(view, localOffsetValue + 26)
    const localExtraLength = readU16(view, localOffsetValue + 28)

    const localDataOffset =
      localOffsetValue + 30 + localNameLength + localExtraLength

    checkRange(
      localOffsetValue + 30,
      localNameLength + localExtraLength,
      centralOffset,
    )
    checkRange(localDataOffset, compressedSize, centralOffset)
    validateExtra(
      bytes,
      localOffsetValue + 30 + localNameLength,
      localExtraLength,
    )

    if (
      localFlags !== flags ||
      localMethod !== method ||
      localNameLength !== nameLength ||
      !bytes
        .subarray(
          localOffsetValue + 30,
          localOffsetValue + 30 + localNameLength,
        )
        .every((byte, nameIndex) => byte === nameBytes[nameIndex]) ||
      ((flags & 0x0008) === 0 &&
        (localCrc !== crc ||
          localCompressedSize !== compressedSize ||
          localUncompressedSize !== uncompressedSize)) ||
      ((flags & 0x0008) !== 0 &&
        ((localCrc !== 0 && localCrc !== crc) ||
          (localCompressedSize !== 0 &&
            localCompressedSize !== compressedSize) ||
          (localUncompressedSize !== 0 &&
            localUncompressedSize !== uncompressedSize)))
    )
      fail("DOCX ZIP local and central entries disagree.")

    let endOffset = localDataOffset + compressedSize

    if (flags & 0x0008) {
      const descriptorOffset = endOffset

      const descriptorMatches = (offset: number) =>
        offset + 12 <= centralOffset &&
        readU32(view, offset) === crc &&
        readU32(view, offset + 4) === compressedSize &&
        readU32(view, offset + 8) === uncompressedSize

      const signatureless = descriptorMatches(descriptorOffset)

      const signed =
        descriptorOffset + 4 <= centralOffset &&
        readU32(view, descriptorOffset) === 0x08074b50 &&
        descriptorMatches(descriptorOffset + 4)

      if (signatureless === signed) fail("Invalid DOCX ZIP data descriptor.")
      endOffset = descriptorOffset + (signed ? 16 : 12)
    }

    if (
      name.endsWith("/") &&
      (method !== 0 || compressedSize !== 0 || uncompressedSize !== 0)
    )
      fail("Invalid DOCX ZIP directory entry.")

    compressedTotal += compressedSize
    uncompressedTotal += uncompressedSize

    if (
      compressedTotal > bytes.byteLength ||
      uncompressedSize > docxLimits.uncompressedBytes ||
      uncompressedTotal > docxLimits.uncompressedBytes
    )
      fail("DOCX ZIP exceeds its size budget.")

    entries.push({
      name,
      nameBytes,
      flags,
      method,
      crc,
      compressedSize,
      uncompressedSize,
      localOffset: localOffsetValue,
      endOffset,
    })
    offset += recordLength
  }

  if (offset !== centralOffset + centralSize)
    fail("Invalid DOCX ZIP directory size.")

  const ranges = [...entries].sort(
    (left, right) => left.localOffset - right.localOffset,
  )

  for (let index = 1; index < ranges.length; index++) {
    const previous = ranges[index - 1]
    const current = ranges[index]

    if (previous && current && previous.endOffset > current.localOffset)
      fail("Overlapping DOCX ZIP entries.")
  }

  return entries
}

async function inflateRaw(
  bytes: Uint8Array,
  expectedSize: number,
  signal?: AbortSignal,
) {
  if (typeof DecompressionStream === "undefined")
    fail("This environment does not support raw DEFLATE DOCX entries.")

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  let abortListener: (() => void) | undefined

  try {
    const stream = new Blob([Uint8Array.from(bytes)])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"))

    reader = stream.getReader()
    abortListener = () => {
      void reader?.cancel().catch(() => undefined)
    }

    signal?.addEventListener("abort", abortListener, { once: true })

    const chunks: Uint8Array[] = []
    let size = 0

    while (true) {
      if (signal?.aborted) {
        await reader.cancel()
        fail("DOCX import cancelled.")
      }

      const result = await reader.read()

      if (signal?.aborted) fail("DOCX import cancelled.")

      if (result.done) break
      size += result.value.byteLength

      if (size > expectedSize || size > docxLimits.uncompressedBytes) {
        await reader.cancel()
        fail("DOCX ZIP entry exceeds its declared size.")
      }

      chunks.push(result.value)
    }

    if (size !== expectedSize) fail("DOCX ZIP entry size mismatch.")
    const output = new Uint8Array(size)
    let offset = 0

    for (const chunk of chunks) {
      output.set(chunk, offset)
      offset += chunk.byteLength
    }

    return output
  } catch (error) {
    if (error instanceof DocumentError) throw error
    throw new DocumentError([
      error instanceof Error ? error.message : "Invalid DOCX DEFLATE stream.",
    ])
  } finally {
    if (abortListener) signal?.removeEventListener("abort", abortListener)
    reader?.releaseLock()
  }
}

function scanZipArchive(source: Uint8Array) {
  if (source.byteLength > docxLimits.compressedBytes)
    fail("DOCX archive exceeds its compressed size limit.")
  const bytes = source
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  if (bytes.byteLength < 22) fail("Invalid DOCX ZIP archive.")
  const endRecord = findEndRecord(bytes, view)

  if (readU16(view, endRecord + 4) !== 0 || readU16(view, endRecord + 6) !== 0)
    fail("Multi-disk DOCX archives are unsupported.")

  return { bytes, view, entries: scanDirectory(bytes, view, endRecord) }
}

function entryData(
  bytes: Uint8Array,
  view: DataView,
  entry: ZipDirectoryEntry,
) {
  const start =
    entry.localOffset +
    30 +
    readU16(view, entry.localOffset + 26) +
    readU16(view, entry.localOffset + 28)

  const compressed = bytes.subarray(start, start + entry.compressedSize)

  return compressed.slice()
}

export function readZipArchive(source: Uint8Array) {
  const { bytes, view, entries } = scanZipArchive(source)
  const output = new Map<string, Uint8Array>()

  for (const entry of entries) {
    if (entry.method !== 0)
      fail("Synchronous ZIP reading supports stored entries only.")
    const data = entryData(bytes, view, entry)

    if (data.byteLength !== entry.uncompressedSize || crc32(data) !== entry.crc)
      fail("DOCX ZIP entry checksum mismatch.")
    output.set(entry.name, data)
  }

  return output
}

export async function readZipArchiveAsync(
  source: Uint8Array,
  signal?: AbortSignal,
) {
  if (signal?.aborted) fail("DOCX import cancelled.")
  const { bytes, view, entries } = scanZipArchive(source)
  const output = new Map<string, Uint8Array>()

  for (const entry of entries) {
    if (signal?.aborted) fail("DOCX import cancelled.")
    const compressed = entryData(bytes, view, entry)

    const data =
      entry.method === 0
        ? compressed
        : await inflateRaw(compressed, entry.uncompressedSize, signal)

    if (data.byteLength !== entry.uncompressedSize || crc32(data) !== entry.crc)
      fail("DOCX ZIP entry checksum mismatch.")
    output.set(entry.name, data)
  }

  if (signal?.aborted) fail("DOCX import cancelled.")

  return output
}

export function writeZipArchive(entries: readonly ZipWriteEntry[]) {
  if (entries.length > 65_535) fail("Too many ZIP entries.")
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let localOffset = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const method = entry.method ?? 0
    const compressed = method === 0 ? entry.data : entry.compressedData

    if (!compressed) fail("Missing compressed ZIP entry data.")

    if (name.byteLength > 65_535) fail("ZIP entry name is too long.")

    const flags = entry.flags ?? 0x0800
    const crc = crc32(entry.data)
    const local = new Uint8Array(30 + name.byteLength + compressed.byteLength)
    const localView = new DataView(local.buffer)
    writeU32(localView, 0, 0x04034b50)
    writeU16(localView, 4, 20)
    writeU16(localView, 6, flags)
    writeU16(localView, 8, method)
    writeU16(localView, 10, 0)
    writeU16(localView, 12, 0x0021)
    writeU32(localView, 14, crc)
    writeU32(localView, 18, compressed.byteLength)
    writeU32(localView, 22, entry.data.byteLength)
    writeU16(localView, 26, name.byteLength)
    writeU16(localView, 28, 0)
    local.set(name, 30)
    local.set(compressed, 30 + name.byteLength)
    localParts.push(local)

    const central = new Uint8Array(46 + name.byteLength)
    const centralView = new DataView(central.buffer)
    writeU32(centralView, 0, 0x02014b50)
    writeU16(centralView, 4, 0x0314)
    writeU16(centralView, 6, 20)
    writeU16(centralView, 8, flags)
    writeU16(centralView, 10, method)
    writeU16(centralView, 12, 0)
    writeU16(centralView, 14, 0x0021)
    writeU32(centralView, 16, crc)
    writeU32(centralView, 20, compressed.byteLength)
    writeU32(centralView, 24, entry.data.byteLength)
    writeU16(centralView, 28, name.byteLength)
    writeU16(centralView, 30, 0)
    writeU16(centralView, 32, 0)
    writeU16(centralView, 34, 0)
    writeU16(centralView, 36, 0)
    writeU32(centralView, 38, 0)
    writeU32(centralView, 42, localOffset)
    central.set(name, 46)
    centralParts.push(central)
    localOffset += local.byteLength
  }

  const centralSize = centralParts.reduce(
    (sum, part) => sum + part.byteLength,
    0,
  )

  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  writeU32(endView, 0, 0x06054b50)
  writeU16(endView, 4, 0)
  writeU16(endView, 6, 0)
  writeU16(endView, 8, entries.length)
  writeU16(endView, 10, entries.length)
  writeU32(endView, 12, centralSize)
  writeU32(endView, 16, localOffset)
  writeU16(endView, 20, 0)
  const output = new Uint8Array(localOffset + centralSize + end.byteLength)
  let offset = 0

  for (const part of [...localParts, ...centralParts, end]) {
    output.set(part, offset)
    offset += part.byteLength
  }

  return output
}
