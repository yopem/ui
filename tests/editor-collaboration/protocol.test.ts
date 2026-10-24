import {
  awarenessFrame,
  candidateState,
  decodeFrame,
  syncFrame,
  validateAwareness,
} from "@editor/server/collaboration/protocol"
import { describe, expect, test } from "bun:test"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import { applyAwarenessUpdate, Awareness } from "y-protocols/awareness"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"

function updateFrame(doc: Y.Doc, subtype: number = sync.messageYjsUpdate) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  encoding.writeVarUint(encoder, subtype)
  encoding.writeVarUint8Array(encoder, Y.encodeStateAsUpdate(doc))

  return encoding.toUint8Array(encoder)
}

function presence(
  id: number,
  clock: number,
  state: {
    user?: { id: string; role?: string }
    cursor?: null | { arbitrary: string }
  } | null,
) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint(encoder, id)
  encoding.writeVarUint(encoder, clock)
  encoding.writeVarString(encoder, JSON.stringify(state))

  return encoding.toUint8Array(encoder)
}

const owner = {
  clientId: 42,
  clock: -1,
  user: { id: "host-user", name: "Host" },
}

describe("bounded standard Yjs protocol core", function protocolContracts() {
  test("two clients synchronize state without server SyncStep1", function twoClientSync() {
    const first = new Y.Doc()
    const second = new Y.Doc()
    first.getText("content").insert(0, "hello")
    const frame = decodeFrame(updateFrame(first), true)
    expect(frame.kind).toBe("update")

    if (frame.kind !== "update") throw new Error("update")

    const accepted = candidateState(
      Y.encodeStateAsUpdate(second),
      frame.payload,
    )

    Y.applyUpdate(second, accepted)
    second.getText("content").insert(5, " world")
    const state = candidateState(accepted, Y.encodeStateAsUpdate(second))
    const request = encoding.createEncoder()
    encoding.writeVarUint(request, 0)
    sync.writeSyncStep1(request, first)
    const decoded = decodeFrame(encoding.toUint8Array(request), false)

    if (decoded.kind !== "vector") throw new Error("vector")
    const response = syncFrame(state, decoded.payload)
    const input = decoding.createDecoder(response)
    expect(decoding.readVarUint(input)).toBe(0)
    expect(decoding.readVarUint(input)).toBe(sync.messageYjsSyncStep2)
    Y.applyUpdate(first, decoding.readVarUint8Array(input))
    expect(first.getText("content").toJSON()).toBe("hello world")
    first.destroy()
    second.destroy()
  })

  test("readers cannot send either mutating subtype", function readerWrites() {
    const doc = new Y.Doc()

    for (const subtype of [sync.messageYjsSyncStep2, sync.messageYjsUpdate])
      expect(() => decodeFrame(updateFrame(doc, subtype), false)).toThrow(
        "denied",
      )
    doc.destroy()
  })

  test("reject malformed, truncated, trailing and oversized frames", function invalidFrames() {
    const doc = new Y.Doc()
    const valid = updateFrame(doc)

    for (const invalid of [
      new Uint8Array(),
      Uint8Array.of(127),
      Uint8Array.of(128),
      valid.slice(0, -1),
      new Uint8Array([...valid, 0]),
      new Uint8Array(65537),
    ])
      expect(() => decodeFrame(invalid, true)).toThrow()
    const vector = encoding.createEncoder()
    encoding.writeVarUint(vector, 0)
    encoding.writeVarUint(vector, 0)
    encoding.writeVarUint8Array(vector, Uint8Array.of(1, 1))
    expect(() => decodeFrame(encoding.toUint8Array(vector), true)).toThrow()
    doc.destroy()
  })

  test("candidate rollback, duplicate updates, pending structures and subdocuments", function candidateRollback() {
    const doc = new Y.Doc()
    doc.getText("content").insert(0, "preserve")
    const prior = Y.encodeStateAsUpdate(doc)
    expect(candidateState(prior, prior)).toEqual(prior)

    for (const bad of [
      Uint8Array.of(255),
      prior.slice(0, -1),
      new Uint8Array([...prior, 0]),
    ])
      expect(() => candidateState(prior, bad)).toThrow()
    const missing: Uint8Array[] = []
    doc.on("update", (bytes: Uint8Array) => missing.push(bytes))
    doc.getText("content").insert(8, " later")
    expect(() =>
      candidateState(
        Y.encodeStateAsUpdate(new Y.Doc()),
        missing[0] ?? new Uint8Array(),
      ),
    ).toThrow("pending")
    const sub = new Y.Doc()
    sub.getMap("root").set("child", new Y.Doc())
    expect(() => candidateState(prior, Y.encodeStateAsUpdate(sub))).toThrow(
      "subdocument",
    )
    expect(Y.encodeStateAsUpdate(doc).length).toBeGreaterThan(prior.length)
    const restored = new Y.Doc()
    Y.applyUpdate(restored, prior)
    expect(restored.getText("content").toJSON()).toBe("preserve")
    const huge = new Y.Doc()
    huge.getText("content").insert(0, "x".repeat(140000))
    expect(() => candidateState(prior, Y.encodeStateAsUpdate(huge))).toThrow(
      "budget",
    )
    doc.destroy()
    sub.destroy()
    restored.destroy()
    huge.destroy()
  })

  test("awareness ownership, clocks, normalized user and removals", function awarenessOwnership() {
    for (const state of [{ user: { id: "victim" }, cursor: null }, null])
      expect(() => validateAwareness(presence(43, 1, state), owner)).toThrow(
        "denied",
      )

    const validated = validateAwareness(
      presence(42, 1, { user: { id: "victim", role: "admin" }, cursor: null }),
      owner,
    )

    const doc = new Y.Doc()
    const awareness = new Awareness(doc)
    applyAwarenessUpdate(awareness, validated.payload, "server")
    expect(awareness.getStates().get(42)).toEqual({
      user: owner.user,
      cursor: null,
    })
    expect(() =>
      validateAwareness(presence(42, 1, {}), { ...owner, clock: 1 }),
    ).toThrow()
    expect(() =>
      validateAwareness(presence(42, 2, { cursor: { arbitrary: "x" } }), owner),
    ).toThrow()

    const removed = validateAwareness(presence(42, 2, null), {
      ...owner,
      clock: 1,
    })

    applyAwarenessUpdate(awareness, removed.payload, "server")
    expect(awareness.getStates().has(42)).toBe(false)
    expect(awarenessFrame(validated.payload)[0]).toBe(1)
    awareness.destroy()
    doc.destroy()
  })
})
