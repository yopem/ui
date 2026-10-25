import {
  readZipArchive,
  readZipArchiveAsync,
  writeZipArchive,
} from "@editor/docx-zip"
import { DocumentError } from "@yopem-ui/editor/document"
import { expect, test } from "bun:test"

const descriptorSignature = 0x08074b50

type DescriptorField = "crc" | "compressedSize" | "uncompressedSize"

function view(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

async function expectDocumentError(promise: Promise<unknown>) {
  const [result] = await Promise.allSettled([promise])

  expect(result.status).toBe("rejected")

  if (result.status === "rejected")
    expect(result.reason).toBeInstanceOf(DocumentError)
}

function descriptorArchive(
  data: Uint8Array,
  signed: boolean,
  corrupt?: DescriptorField,
) {
  const source = writeZipArchive([{ name: "entry.bin", data }])
  const sourceView = view(source)
  const sourceEnd = source.byteLength - 22
  const centralOffset = sourceView.getUint32(sourceEnd + 16, true)
  const centralSize = sourceView.getUint32(sourceEnd + 12, true)
  const central = source.slice(centralOffset, centralOffset + centralSize)
  const centralView = view(central)
  const localNameLength = sourceView.getUint16(26, true)
  const localExtraLength = sourceView.getUint16(28, true)
  const compressedSize = centralView.getUint32(20, true)
  const localEnd = 30 + localNameLength + localExtraLength + compressedSize
  const local = source.slice(0, localEnd)
  const localView = view(local)
  const crc = centralView.getUint32(16, true)
  const uncompressedSize = centralView.getUint32(24, true)
  const crcValue = corrupt === "crc" ? (crc + 1) >>> 0 : crc

  const compressedSizeValue =
    corrupt === "compressedSize" ? compressedSize + 1 : compressedSize

  const uncompressedSizeValue =
    corrupt === "uncompressedSize" ? uncompressedSize + 1 : uncompressedSize

  const descriptorFields = signed
    ? [
        descriptorSignature,
        crcValue,
        compressedSizeValue,
        uncompressedSizeValue,
      ]
    : [crcValue, compressedSizeValue, uncompressedSizeValue]

  const descriptor = new Uint8Array(descriptorFields.length * 4)
  const descriptorView = view(descriptor)

  descriptorFields.forEach((field, index) =>
    descriptorView.setUint32(index * 4, field, true),
  )

  localView.setUint16(6, localView.getUint16(6, true) | 0x0008, true)
  localView.setUint32(14, 0, true)
  localView.setUint32(18, 0, true)
  localView.setUint32(22, 0, true)
  centralView.setUint16(8, centralView.getUint16(8, true) | 0x0008, true)

  const end = source.slice(centralOffset + centralSize)

  const output = new Uint8Array(
    local.byteLength +
      descriptor.byteLength +
      central.byteLength +
      end.byteLength,
  )

  output.set(local)
  output.set(descriptor, local.byteLength)
  output.set(central, local.byteLength + descriptor.byteLength)
  output.set(end, local.byteLength + descriptor.byteLength + central.byteLength)
  view(output).setUint32(
    output.byteLength - 22 + 16,
    local.byteLength + descriptor.byteLength,
    true,
  )

  return output
}

function overlappingArchive() {
  const innerData = Uint8Array.of(9, 8, 7)
  const inner = writeZipArchive([{ name: "inner.bin", data: innerData }])
  const innerView = view(inner)

  const innerCentralOffset = innerView.getUint32(
    inner.byteLength - 22 + 16,
    true,
  )

  const innerLocalRecord = inner.slice(0, innerCentralOffset)

  const source = writeZipArchive([
    { name: "outer.bin", data: innerLocalRecord },
    { name: "inner.bin", data: innerData },
  ])

  const sourceView = view(source)
  const endOffset = source.byteLength - 22
  const centralOffset = sourceView.getUint32(endOffset + 16, true)
  const firstNameLength = sourceView.getUint16(centralOffset + 28, true)
  const firstExtraLength = sourceView.getUint16(centralOffset + 30, true)
  const firstCommentLength = sourceView.getUint16(centralOffset + 32, true)

  const secondCentralOffset =
    centralOffset + 46 + firstNameLength + firstExtraLength + firstCommentLength

  const outerNameLength = sourceView.getUint16(26, true)
  const outerExtraLength = sourceView.getUint16(28, true)
  const nestedLocalOffset = 30 + outerNameLength + outerExtraLength

  sourceView.setUint32(secondCentralOffset + 42, nestedLocalOffset, true)

  return source
}

test("accepts signed and signatureless data descriptors", () => {
  const data = new TextEncoder().encode("descriptor payload")

  for (const signed of [false, true]) {
    const archive = descriptorArchive(data, signed)

    expect(readZipArchive(archive).get("entry.bin")).toEqual(data)
  }
})

test("accepts a signatureless descriptor whose CRC equals the signature", () => {
  const data = Uint8Array.from([
    ...new TextEncoder().encode("descriptor"),
    0xae,
    0x7c,
    0xe8,
    0xd6,
  ])

  const archive = descriptorArchive(data, false)

  expect(readZipArchive(archive).get("entry.bin")).toEqual(data)
})

test("rejects malformed data descriptor tuples", () => {
  const data = new TextEncoder().encode("descriptor payload")

  for (const field of ["crc", "compressedSize", "uncompressedSize"] as const) {
    expect(() => readZipArchive(descriptorArchive(data, false, field))).toThrow(
      DocumentError,
    )
    expect(() => readZipArchive(descriptorArchive(data, true, field))).toThrow(
      DocumentError,
    )
  }
})

test("rejects local and central header mismatches", () => {
  const source = writeZipArchive([
    { name: "entry.bin", data: new TextEncoder().encode("archive payload") },
  ])

  const sourceView = view(source)
  const centralOffset = sourceView.getUint32(source.byteLength - 22 + 16, true)

  for (const [localOffset, centralFieldOffset] of [
    [14, 16],
    [18, 20],
    [22, 24],
  ] as const) {
    const invalid = source.slice()
    const invalidView = view(invalid)
    invalidView.setUint32(
      localOffset,
      invalidView.getUint32(centralOffset + centralFieldOffset, true) ^ 1,
      true,
    )

    expect(() => readZipArchive(invalid)).toThrow(DocumentError)
  }
})

test("rejects overlapping local records", () => {
  expect(() => readZipArchive(overlappingArchive())).toThrow(DocumentError)
})

test("cancels a pending decompressor read when its signal aborts", async () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "DecompressionStream",
  )

  let resolveReadStarted: (() => void) | undefined

  const readStarted = new Promise<void>((resolve) => {
    resolveReadStarted = resolve
  })

  let releasePendingPull: (() => void) | undefined
  let cancelled = false
  let abortListenersAdded = 0
  let abortListenersRemoved = 0

  class PendingDecompressionStream {
    readable = new ReadableStream<Uint8Array>({
      pull() {
        resolveReadStarted?.()

        return new Promise<void>((resolve) => {
          releasePendingPull = resolve
        })
      },
      cancel() {
        cancelled = true
        releasePendingPull?.()
      },
    })
    writable = new WritableStream<Uint8Array>()
  }

  const archive = writeZipArchive([
    {
      name: "entry.bin",
      data: Uint8Array.of(1),
      method: 8,
      compressedData: Uint8Array.of(0),
    },
  ])

  const controller = new AbortController()
  const signal = controller.signal
  const addEventListener = EventTarget.prototype.addEventListener.bind(signal)

  const removeEventListener =
    EventTarget.prototype.removeEventListener.bind(signal)

  const addListenerDescriptor = Object.getOwnPropertyDescriptor(
    signal,
    "addEventListener",
  )

  const removeListenerDescriptor = Object.getOwnPropertyDescriptor(
    signal,
    "removeEventListener",
  )

  Object.defineProperty(signal, "addEventListener", {
    configurable: true,
    value: (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === "abort") abortListenersAdded++
      addEventListener(type, listener, options)
    },
  })
  Object.defineProperty(signal, "removeEventListener", {
    configurable: true,
    value: (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) => {
      if (type === "abort") abortListenersRemoved++
      removeEventListener(type, listener, options)
    },
  })
  Object.defineProperty(globalThis, "DecompressionStream", {
    configurable: true,
    writable: true,
    value: PendingDecompressionStream,
  })

  try {
    const pending = readZipArchiveAsync(archive, controller.signal)
    await readStarted
    controller.abort()

    await expectDocumentError(pending)
    expect(cancelled).toBe(true)
    expect(abortListenersAdded).toBe(1)
    expect(abortListenersRemoved).toBe(1)
  } finally {
    if (originalDescriptor)
      Object.defineProperty(
        globalThis,
        "DecompressionStream",
        originalDescriptor,
      )
    else Reflect.deleteProperty(globalThis, "DecompressionStream")

    if (addListenerDescriptor)
      Object.defineProperty(signal, "addEventListener", addListenerDescriptor)
    else Reflect.deleteProperty(signal, "addEventListener")

    if (removeListenerDescriptor)
      Object.defineProperty(
        signal,
        "removeEventListener",
        removeListenerDescriptor,
      )
    else Reflect.deleteProperty(signal, "removeEventListener")
  }
})
