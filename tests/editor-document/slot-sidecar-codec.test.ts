import { DocumentError, documentLimits } from "@editor/document/boundary"
import {
  decodeSlotSidecar,
  encodeSlotSidecar,
} from "@editor/document/slot-sidecar"
import { expect, test } from "bun:test"

type FixtureValue =
  | null
  | boolean
  | number
  | string
  | FixtureValue[]
  | { [key: string]: FixtureValue }

type FixtureObject = Record<string, FixtureValue>

const isBlock = (type: string) =>
  ["paragraph", "heading", "editor-toc"].includes(type)

const paragraph = (text = "") => ({
  type: "paragraph",
  version: 1,
  children: text ? [{ type: "text", version: 1, text }] : [],
})

const root = () => ({ type: "root", version: 1, children: [paragraph("one")] })

const raw = (source: string) =>
  Buffer.from(source, "utf8").toString("base64url")

const payload = (value: FixtureObject) => raw(JSON.stringify(value))

const record = (
  owner: (string | number)[][],
  name = "note",
  value: FixtureObject = paragraph(),
) => ({
  owner,
  name,
  value,
})

const wire = (slots: FixtureObject[], node: FixtureObject = root()) => ({
  version: 1,
  root: node,
  slots,
})

test("round trips child-first canonical paths, nested slots and independent names", () => {
  const document = {
    ...root(),
    metadata: { label: "é😀", list: [true, null, 42] },
    children: [
      {
        ...paragraph("one"),
        $slots: {
          note: { ...paragraph("nested"), $slots: { note: paragraph("deep") } },
        },
      },
      { ...paragraph("two"), $slots: { note: paragraph("second") } },
    ],
    $slots: {
      z: paragraph("last"),
      a: {
        type: "editor-toc",
        version: 1,
        $slots: { inner: paragraph("toc") },
      },
    },
  }

  const original = structuredClone(document)
  const encoded = encodeSlotSidecar(document, isBlock)
  const decoded = decodeSlotSidecar(encoded, isBlock)
  expect(decoded).toEqual(document)
  expect(document).toEqual(original)

  const kindPolicy = (
    type: string,
    fields: Readonly<Record<string, null | boolean | number | string>>,
  ) => {
    expect(fields.$slots).toBeUndefined()
    expect(Object.isFrozen(fields)).toBe(true)
    expect(Reflect.set(fields, "type", "text")).toBe(false)
    expect(fields.children).toBeUndefined()

    return (
      type === "paragraph" || (type === "editor-toc" && fields.kind === "block")
    )
  }

  const kindDocument = {
    ...root(),
    $slots: {
      a: {
        ...paragraph("keep"),
        kind: "block",
        $slots: { inner: { type: "editor-toc", version: 1, kind: "block" } },
      },
    },
  }

  const kindEncoded = encodeSlotSidecar(kindDocument, kindPolicy)
  expect(decodeSlotSidecar(kindEncoded, kindPolicy)).toEqual(kindDocument)
  expect(() =>
    encodeSlotSidecar(kindDocument, () => {
      throw new Error("host")
    }),
  ).toThrow(DocumentError)
  expect(() =>
    decodeSlotSidecar(kindEncoded, () => {
      throw new Error("host")
    }),
  ).toThrow(DocumentError)
  expect(() => encodeSlotSidecar(kindDocument, () => false)).toThrow(
    DocumentError,
  )
  expect(() => decodeSlotSidecar(kindEncoded, () => false)).toThrow(
    DocumentError,
  )

  const envelope = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  )

  expect(
    envelope.slots.map((item: { owner: unknown[]; name: string }) => [
      item.owner,
      item.name,
    ]),
  ).toEqual([
    [[["child", 0]], "note"],
    [
      [
        ["child", 0],
        ["slot", "note"],
      ],
      "note",
    ],
    [[["child", 1]], "note"],
    [[], "a"],
    [[["slot", "a"]], "inner"],
    [[], "z"],
  ])
})

test("does not change frozen inputs and requires at least one slot", () => {
  const node = Object.freeze({
    ...paragraph(),
    $slots: Object.freeze({ x: Object.freeze(paragraph()) }),
  })

  const input = Object.freeze({ ...root(), children: Object.freeze([node]) })
  expect<object>(
    decodeSlotSidecar(encodeSlotSidecar(input, isBlock), isBlock),
  ).toEqual(input)
  expect(() => encodeSlotSidecar(root(), isBlock)).toThrow()
  expect(() => encodeSlotSidecar({ ...root(), $slots: {} }, isBlock)).toThrow()
})

test("rejects malformed encoding, invalid UTF-8, duplicate decoded keys and unsafe keys", () => {
  for (const encoded of [
    "",
    "a",
    "AA=",
    "AA+",
    "AA/",
    "AA\n",
    "AB",
    "_w",
    "77u_",
    "e30",
  ]) {
    expect(() => decodeSlotSidecar(encoded, isBlock)).toThrow()
  }

  const valid = JSON.stringify(wire([record([])]))
  expect(decodeSlotSidecar(raw(valid), isBlock)).toEqual({
    ...root(),
    $slots: { note: paragraph() },
  })

  const variants = [
    valid.replace('"version":1', '"version":1,"version":1'),
    valid.replace('"version":1', '"version":1,"vers\\u0069on":1'),
    valid.replace('"type":"root"', '"type":"root","type":"root"'),
    valid.replace('"type":"root"', '"type":"root","t\\u0079pe":"root"'),
    valid.replace('"owner":[]', '"owner":[],"owner":[]'),
    valid.replace('"owner":[]', '"owner":[],"own\\u0065r":[]'),
    valid.replace(
      '"value":{"type":"paragraph"',
      '"value":{"type":"paragraph","type":"paragraph"',
    ),
    valid.replace(
      '"value":{"type":"paragraph"',
      '"value":{"type":"paragraph","t\\u0079pe":"paragraph"',
    ),
    valid.replace('"type":"root"', '"type":"root","__proto__":{}'),
    valid.replace('"owner":[]', '"owner":[],"constructor":1'),
    valid.replace('"type":"paragraph"', '"type":"paragraph","prototype":1'),
  ]

  for (const source of variants)
    expect(() => decodeSlotSidecar(raw(source), isBlock)).toThrow(DocumentError)

  const paddedValid =
    valid + " ".repeat((1 - (Buffer.byteLength(valid) % 3) + 3) % 3)

  const canonical = raw(paddedValid)

  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

  const final = alphabet.indexOf(canonical.at(-1) ?? "")
  const noncanonical = canonical.slice(0, -1) + alphabet[final + 1]
  expect(Buffer.from(noncanonical, "base64url")).toEqual(
    Buffer.from(canonical, "base64url"),
  )
  expect(decodeSlotSidecar(canonical, isBlock)).toEqual({
    ...root(),
    $slots: { note: paragraph() },
  })
  expect(() => decodeSlotSidecar(noncanonical, isBlock)).toThrow(DocumentError)
})

test("rejects malformed schema, paths, owners, values and embedded slots", () => {
  const invalid = [
    { ...wire([record([])]), version: 2 },
    { ...wire([record([])]), extra: true },
    wire([]),
    wire([{ ...record([]), extra: true }]),
    wire([record([], "constructor")]),
    wire([record([], "prototype")]),
    wire([record([], "bad name")]),
    wire([record([["child", -1]])]),
    wire([record([["child", 0.5]])]),
    wire([record([["child", "0"]])]),
    wire([record([["child", 1]])]),
    wire([record([["child", 0, 1]])]),
    wire([record([["slot", "unknown"]])]),
    wire([
      record([
        ["child", 0],
        ["child", 0],
      ]),
    ]),
    wire([record([], "a", { type: "root", version: 1, children: [] })]),
    wire([record([], "a", { type: "text", version: 1, text: "x" })]),
    wire([record([], "a", { ...paragraph(), $slots: { x: paragraph() } })]),
    wire([record([])], {
      ...root(),
      children: [{ ...paragraph(), $slots: { x: paragraph() } }],
    }),
  ]

  for (const value of invalid)
    expect(() => decodeSlotSidecar(payload(value), isBlock)).toThrow()

  const negativeZero = JSON.stringify(wire([record([["child", 0]])])).replace(
    '["child",0]',
    '["child",-0]',
  )

  expect(() => decodeSlotSidecar(raw(negativeZero), isBlock)).toThrow()
})

test("rejects repeated, forward and noncanonical records", () => {
  for (const slots of [
    [record([], "a"), record([], "a")],
    [record([["slot", "a"]], "b"), record([], "a")],
    [record([], "z"), record([], "a")],
    [record([], "a"), record([["child", 0]], "b")],
    [record([], "a"), record([["slot", "a"]], "b"), record([], "a")],
  ])
    expect(() => decodeSlotSidecar(payload(wire(slots)), isBlock)).toThrow()
})

test("rejects aliases, cycles, unsupported values, and aggregate excess", () => {
  const shared = paragraph()

  interface RecursiveNode {
    type: string
    version: number
    children: RecursiveNode[]
    $slots?: { x: ReturnType<typeof paragraph> }
  }

  const cyclic: RecursiveNode = {
    type: "root",
    version: 1,
    children: [],
    $slots: { x: paragraph() },
  }

  cyclic.children.push(cyclic)
  expect(
    decodeSlotSidecar(
      encodeSlotSidecar({ ...root(), $slots: { x: paragraph() } }, isBlock),
      isBlock,
    ),
  ).toEqual({ ...root(), $slots: { x: paragraph() } })
  let invoked = false

  const accessor = Object.defineProperty({}, "bad", {
    enumerable: true,
    get() {
      invoked = true
      throw new Error("getter")
    },
  })

  const throwing = new Proxy([], {
    getOwnPropertyDescriptor() {
      throw new Error("trap")
    },
  })

  const throwingKeys = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error("keys")
      },
    },
  )

  const throwingPrototype = new Proxy(
    {},
    {
      getPrototypeOf() {
        throw new Error("prototype")
      },
    },
  )

  const lengthTrap = new Proxy([], {
    get(_target, key) {
      if (key === "length") throw new Error("length")

      return undefined
    },
  })

  expect(
    decodeSlotSidecar(
      encodeSlotSidecar(
        { ...root(), $slots: { x: paragraph() }, metadata: lengthTrap },
        isBlock,
      ),
      isBlock,
    ),
  ).toEqual({ ...root(), $slots: { x: paragraph() }, metadata: [] })
  const revoked = Proxy.revocable([], {})
  revoked.revoke()

  for (const metadata of [
    accessor,
    throwing,
    throwingKeys,
    throwingPrototype,
    revoked.proxy,
  ]) {
    expect(() =>
      encodeSlotSidecar(
        { ...root(), $slots: { x: paragraph() }, metadata },
        isBlock,
      ),
    ).toThrow(DocumentError)
  }

  expect(invoked).toBe(false)

  for (const node of [
    { ...root(), children: [shared, shared], $slots: { x: paragraph() } },
    cyclic,
    { ...root(), $slots: { x: paragraph() }, metadata: { bad: undefined } },
    { ...root(), $slots: { x: paragraph() }, metadata: { bad: Infinity } },
    { ...root(), $slots: { x: paragraph() }, metadata: { bad: -0 } },
    {
      ...root(),
      $slots: { x: paragraph() },
      metadata: "x".repeat(documentLimits.bytes),
    },
    {
      ...root(),
      children: Array.from({ length: 10000 }, () => paragraph()),
      $slots: { x: paragraph() },
    },
  ])
    expect(() => encodeSlotSidecar(node, isBlock)).toThrow()

  const escaped = {
    ...root(),
    $slots: { x: paragraph() },
    metadata: "\u0000".repeat(100),
  }

  expect(
    decodeSlotSidecar(encodeSlotSidecar(escaped, isBlock), isBlock),
  ).toEqual(escaped)
  expect(() =>
    encodeSlotSidecar(
      {
        ...escaped,
        metadata: "\u0000".repeat(Math.floor(documentLimits.bytes / 6) + 1),
      },
      isBlock,
    ),
  ).toThrow(DocumentError)
  let nested: RecursiveNode = { type: "paragraph", version: 1, children: [] }

  for (let index = 0; index < 70; index += 1)
    nested = { type: "paragraph", version: 1, children: [nested] }
  expect(() =>
    encodeSlotSidecar(
      { ...root(), children: [nested], $slots: { x: paragraph() } },
      isBlock,
    ),
  ).toThrow()
  expect(() =>
    decodeSlotSidecar("A".repeat(documentLimits.bytes * 2), isBlock),
  ).toThrow()
})
