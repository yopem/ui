import { scanDocumentJSON } from "@yopem-ui/editor/json-duplicates"
import { z } from "zod"

import {
  checkText,
  DocumentError,
  documentLimits,
  documentSlotNameSchema,
} from "./boundary"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

type ObjectValue = Record<string, Json>

type Segment = ["child", number] | ["slot", string]

interface SlotRecord {
  owner: Segment[]
  name: string
  value: ObjectValue
}

export type SlotSidecarBlockPolicy = (
  type: string,
  fields: Readonly<Record<string, null | boolean | number | string>>,
) => boolean

const maxNodes = 10000

const encoder = new TextEncoder()

function fail(): never {
  throw new DocumentError(["Invalid document slot sidecar."])
}

const objectSchema = z.custom<object>(
  (value) =>
    value !== null &&
    Object(value) === value &&
    !z.function().safeParse(value).success,
)

function isObject<T>(value: T): value is T & object {
  return objectSchema.safeParse(value).success
}

function isString<T>(value: T): value is T & string {
  return z.string().safeParse(value).success
}

function isNumber<T>(value: T): value is T & number {
  return z.number().safeParse(value).success
}

function isBoolean<T>(value: T): value is T & boolean {
  return z.boolean().safeParse(value).success
}

function object(value: Json | undefined): value is ObjectValue {
  return isObject(value) && !Array.isArray(value)
}

const jsonCloneSchema = z.unknown().transform((input): Json => {
  let result: Json = null
  let work = 0
  let size = 0
  let stringJSONSize = 0
  const seen = new Set<object>()

  const pending: {
    value: unknown
    depth: number
    set: (value: Json) => void
  }[] = [
    {
      value: input,
      depth: 0,
      set: (value) => {
        result = value
      },
    },
  ]

  while (pending.length) {
    const entry = pending.pop()

    if (!entry) break

    if (++work > documentLimits.nodes || entry.depth > documentLimits.depth)
      fail()
    const value = entry.value

    if (value === null || isBoolean(value)) entry.set(value)
    else if (isString(value)) {
      size += value.length

      if (size > documentLimits.bytes) fail()
      stringJSONSize += value.length

      if (stringJSONSize > documentLimits.bytes) fail()

      for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index)

        if (code === 34 || code === 92 || [8, 9, 10, 12, 13].includes(code))
          stringJSONSize += 1
        else if (code < 32) stringJSONSize += 5

        if (stringJSONSize > documentLimits.bytes) fail()
      }

      entry.set(value)
    } else if (isNumber(value)) {
      if (!Number.isFinite(value) || Object.is(value, -0)) fail()
      entry.set(value)
    } else if (isObject(value)) {
      if (seen.has(value)) fail()
      seen.add(value)
      const array = Array.isArray(value)
      const prototype = Object.getPrototypeOf(value)

      if (
        array
          ? prototype !== Array.prototype
          : prototype !== Object.prototype && prototype !== null
      )
        fail()
      const keys = Reflect.ownKeys(value)

      if (
        keys.length + work + pending.length >
        documentLimits.nodes + (array ? 1 : 0)
      )
        fail()

      const length = array
        ? Object.getOwnPropertyDescriptor(value, "length")
        : undefined

      if (
        array &&
        (!length ||
          !("value" in length) ||
          !Number.isSafeInteger(length.value) ||
          length.value < 0 ||
          keys.length !== length.value + 1 ||
          keys.at(-1) !== "length")
      )
        fail()
      const target: Json[] | ObjectValue = array ? [] : Object.create(null)
      entry.set(target)

      for (const key of keys) {
        if (array && key === "length") continue

        if (
          !isString(key) ||
          ["__proto__", "constructor", "prototype"].includes(key)
        )
          fail()

        if (
          array &&
          (!/^(0|[1-9]\d*)$/.test(key) ||
            !length ||
            Number(key) >= length.value)
        )
          fail()
        size += key.length

        if (size > documentLimits.bytes) fail()
        const descriptor = Object.getOwnPropertyDescriptor(value, key)

        if (!descriptor || !descriptor.enumerable || !("value" in descriptor))
          fail()
        pending.push({
          value: descriptor.value,
          depth: entry.depth + 1,
          set: (child) => {
            if (Array.isArray(target)) target[Number(key)] = child
            else target[key] = child
          },
        })
      }
    } else fail()
  }

  return result
})

function clone<T>(input: T) {
  try {
    return jsonCloneSchema.parse(input)
  } catch {
    return fail()
  }
}

function node(value: Json | undefined): ObjectValue {
  if (
    !object(value) ||
    !isString(value.type) ||
    !value.type ||
    !isNumber(value.version) ||
    !Number.isSafeInteger(value.version) ||
    value.version < 0
  )
    fail()

  if (value.children !== undefined && !Array.isArray(value.children)) fail()

  return value
}

function block(value: ObjectValue, policy: SlotSidecarBlockPolicy) {
  if (value.type === "root" || !isString(value.type)) fail()

  const fields: Record<string, null | boolean | number | string> =
    Object.create(null)

  for (const [key, field] of Object.entries(value)) {
    if (
      key !== "$slots" &&
      (field === null || isString(field) || isNumber(field) || isBoolean(field))
    )
      fields[key] = field
  }

  try {
    if (policy(value.type, Object.freeze(fields)) !== true) fail()
  } catch {
    fail()
  }
}

function name(value: Json | undefined): string {
  if (!isString(value) || !documentSlotNameSchema.safeParse(value).success)
    fail()

  return value
}

function assertNoEmbeddedSlots(value: Json) {
  const pending = [value]

  while (pending.length) {
    const current = pending.pop()

    if (!current || !isObject(current)) continue

    if (!Array.isArray(current) && Object.hasOwn(current, "$slots")) fail()

    for (const child of Object.values(current))
      if (child && isObject(child)) pending.push(child)
  }
}

function collect(root: ObjectValue, policy: SlotSidecarBlockPolicy) {
  if (root.type !== "root" || !Array.isArray(root.children)) fail()
  const records: SlotRecord[] = []
  const nodes = new Set<ObjectValue>()

  const pending: {
    value: ObjectValue
    path: Segment[]
    depth: number
    emit?: { owner: Segment[]; name: string }
  }[] = [{ value: root, path: [], depth: 0 }]

  let pathWork = 0

  while (pending.length) {
    const entry = pending.pop()

    if (!entry) break
    const current = node(entry.value)

    if (
      nodes.has(current) ||
      nodes.size >= maxNodes ||
      entry.depth > documentLimits.depth
    )
      fail()
    nodes.add(current)

    if (entry.emit) records.push({ ...entry.emit, value: current })
    const slots = current.$slots

    if (slots !== undefined) {
      if (!object(slots) || Object.keys(slots).length === 0) fail()

      if (current !== root) block(current, policy)
      delete current.$slots
      const names = Object.keys(slots).sort()

      for (let index = names.length - 1; index >= 0; index -= 1) {
        const slotName = name(names[index])
        const value = node(slots[slotName])
        block(value, policy)
        pathWork += entry.path.length + 1

        if (pathWork > maxNodes) fail()
        pending.push({
          value,
          path: [...entry.path, ["slot", slotName]],
          depth: entry.depth + 1,
          emit: { owner: entry.path, name: slotName },
        })
      }
    }

    if (Array.isArray(current.children)) {
      for (let index = current.children.length - 1; index >= 0; index -= 1) {
        const child = node(current.children[index])
        pending.push({
          value: child,
          path: [...entry.path, ["child", index]],
          depth: entry.depth + 1,
        })
      }
    }

    if (pending.length + nodes.size > maxNodes) fail()
  }

  assertNoEmbeddedSlots(root)

  for (const record of records) assertNoEmbeddedSlots(record.value)

  return records
}

function serialize(value: Json) {
  const source = JSON.stringify(value)
  checkText(source)

  return source
}

function encodeBytes(bytes: Uint8Array) {
  let binary = ""

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

export function encodeSlotSidecar<T>(input: T, policy: SlotSidecarBlockPolicy) {
  const root = node(clone(input))

  serialize(root)

  const records = collect(root, policy)

  if (!records.length) fail()

  const source = serialize({
    version: 1,
    root,
    slots: records.map(({ owner, name, value }) => ({ owner, name, value })),
  })

  if (scanDocumentJSON(source, documentLimits.depth)) fail()

  clone(JSON.parse(source))

  return encodeBytes(encoder.encode(source))
}

export function decodeSlotSidecar(
  encoded: string,
  policy: SlotSidecarBlockPolicy,
) {
  if (
    !isString(encoded) ||
    !encoded ||
    encoded.length > Math.ceil((documentLimits.bytes * 4) / 3) ||
    !/^[A-Za-z0-9_-]+$/.test(encoded) ||
    encoded.length % 4 === 1
  )
    fail()
  let source: string

  try {
    const binary = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

    if (bytes.length > documentLimits.bytes || encodeBytes(bytes) !== encoded)
      fail()
    source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    )
    checkText(source)

    if (scanDocumentJSON(source, documentLimits.depth)) fail()
  } catch {
    return fail()
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(source)
  } catch {
    return fail()
  }

  const envelope = clone(parsed)

  if (
    !object(envelope) ||
    Object.keys(envelope).sort().join(",") !== "root,slots,version" ||
    envelope.version !== 1 ||
    !Array.isArray(envelope.slots) ||
    !envelope.slots.length ||
    envelope.slots.length > maxNodes
  )
    fail()
  const root = node(envelope.root)

  if (root.type !== "root" || !Array.isArray(root.children)) fail()
  assertNoEmbeddedSlots(root)
  const expected: { owner: Segment[]; name: string }[] = []
  let pathWork = 0

  for (const item of envelope.slots) {
    if (
      !object(item) ||
      Object.keys(item).sort().join(",") !== "name,owner,value" ||
      !Array.isArray(item.owner)
    )
      fail()
    const slotName = name(item.name)
    const value = node(item.value)
    block(value, policy)
    assertNoEmbeddedSlots(value)
    let owner = root
    const path: Segment[] = []
    pathWork += item.owner.length

    if (pathWork > maxNodes || item.owner.length > documentLimits.depth) fail()

    for (const segment of item.owner) {
      if (!Array.isArray(segment) || segment.length !== 2) fail()

      if (segment[0] === "child") {
        const index = segment[1]

        if (
          !isNumber(index) ||
          !Number.isSafeInteger(index) ||
          index < 0 ||
          Object.is(index, -0) ||
          !Array.isArray(owner.children) ||
          index >= owner.children.length
        )
          fail()
        owner = node(owner.children[index])
        path.push(["child", index])
      } else if (segment[0] === "slot") {
        const slotName = name(segment[1])

        if (!object(owner.$slots) || !Object.hasOwn(owner.$slots, slotName))
          fail()
        owner = node(owner.$slots[slotName])
        path.push(["slot", slotName])
      } else fail()
    }

    if (owner !== root) block(owner, policy)

    if (owner.$slots === undefined) owner.$slots = Object.create(null)

    if (!object(owner.$slots) || Object.hasOwn(owner.$slots, slotName)) fail()
    owner.$slots[slotName] = value
    expected.push({ owner: path, name: slotName })
  }

  const copy = node(clone(root))
  serialize(copy)
  const actual = collect(copy, policy)

  if (
    actual.length !== expected.length ||
    actual.some(
      (item, index) =>
        JSON.stringify([item.owner, item.name]) !==
        JSON.stringify([expected[index]?.owner, expected[index]?.name]),
    )
  )
    fail()

  return root
}
