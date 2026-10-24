import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"
import { z } from "zod"

import { preflightUpdate } from "./preflight"

export const collaborationLimits = Object.freeze({
  frameBytes: 65536,
  stateBytes: 61440,
  clients: 32,
  structs: 2048,
  logicalLength: 61440,
  awarenessBytes: 4096,
})

export class CollaborationError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "denied"
      | "budget"
      | "pending"
      | "subdocument"
      | "conflict"
      | "corrupt"
      | "unavailable"
      | "aborted"
      | "uncertain",
  ) {
    super(code)
    this.name = "CollaborationError"
  }
}

export type CollaborationFrame =
  | { kind: "vector"; payload: Uint8Array }
  | { kind: "update"; payload: Uint8Array }
  | { kind: "awareness"; payload: Uint8Array }

function bounded(bytes: Uint8Array, maximum: number) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0)
    throw new CollaborationError("invalid")

  if (bytes.length > maximum) throw new CollaborationError("budget")
}

function complete(decoder: decoding.Decoder) {
  if (decoding.hasContent(decoder)) throw new CollaborationError("invalid")
}

function clientId(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 4294967295)
    throw new CollaborationError("invalid")

  return value
}

function vector(bytes: Uint8Array) {
  bounded(bytes, 512)
  const decoder = decoding.createDecoder(bytes)
  const count = decoding.readVarUint(decoder)

  if (count > collaborationLimits.clients)
    throw new CollaborationError("budget")
  const ids = new Set<number>()

  for (let index = 0; index < count; index++) {
    const id = clientId(decoding.readVarUint(decoder))
    const clock = decoding.readVarUint(decoder)

    if (
      ids.has(id) ||
      !Number.isSafeInteger(clock) ||
      clock < 0 ||
      clock > collaborationLimits.logicalLength
    )
      throw new CollaborationError("invalid")
    ids.add(id)
  }

  complete(decoder)
}

export function decodeFrame(
  bytes: Uint8Array,
  mayWrite: boolean,
): CollaborationFrame {
  bounded(bytes, collaborationLimits.frameBytes)

  try {
    const decoder = decoding.createDecoder(bytes)
    const type = decoding.readVarUint(decoder)

    if (type === 1) {
      const payload = decoding.readVarUint8Array(decoder)
      bounded(payload, collaborationLimits.awarenessBytes)
      complete(decoder)

      return { kind: "awareness", payload: payload.slice() }
    }

    if (type !== 0) throw new CollaborationError("invalid")
    const subtype = decoding.readVarUint(decoder)

    if (
      subtype !== sync.messageYjsSyncStep1 &&
      subtype !== sync.messageYjsSyncStep2 &&
      subtype !== sync.messageYjsUpdate
    )
      throw new CollaborationError("invalid")

    if (subtype !== sync.messageYjsSyncStep1 && !mayWrite)
      throw new CollaborationError("denied")
    const payload = decoding.readVarUint8Array(decoder)
    bounded(payload, collaborationLimits.stateBytes)
    complete(decoder)

    if (subtype === sync.messageYjsSyncStep1) vector(payload)

    return {
      kind: subtype === sync.messageYjsSyncStep1 ? "vector" : "update",
      payload: payload.slice(),
    }
  } catch (error) {
    if (error instanceof CollaborationError) throw error
    throw new CollaborationError("invalid")
  }
}

function applyComplete(doc: Y.Doc, bytes: Uint8Array) {
  bounded(bytes, collaborationLimits.stateBytes)
  preflightUpdate(bytes)
  const decoder = decoding.createDecoder(bytes)
  Y.readUpdate(decoder, doc)
  complete(decoder)
}

function validateDoc(doc: Y.Doc) {
  if (doc.store.pendingStructs || doc.store.pendingDs)
    throw new CollaborationError("pending")

  if (doc.getSubdocs().size) throw new CollaborationError("subdocument")

  if (
    doc.store.clients.size > collaborationLimits.clients ||
    doc.share.size > collaborationLimits.structs
  )
    throw new CollaborationError("budget")
  let count = 0
  let length = 0

  for (const [id, structs] of doc.store.clients) {
    clientId(id)
    count += structs.length

    for (const struct of structs) length += struct.length
  }

  if (
    count > collaborationLimits.structs ||
    length > collaborationLimits.logicalLength
  )
    throw new CollaborationError("budget")
}

export function candidateState(prior: Uint8Array, update: Uint8Array) {
  const candidate = new Y.Doc()

  try {
    applyComplete(candidate, prior)
    applyComplete(candidate, update)
    validateDoc(candidate)
    const state = Y.encodeStateAsUpdate(candidate)
    bounded(state, collaborationLimits.stateBytes)
    preflightUpdate(state)

    return state
  } catch (error) {
    if (error instanceof CollaborationError) throw error
    throw new CollaborationError("invalid")
  } finally {
    candidate.destroy()
  }
}

export function syncFrame(state: Uint8Array, stateVector: Uint8Array) {
  vector(stateVector)
  const doc = new Y.Doc()

  try {
    applyComplete(doc, state)
    validateDoc(doc)
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 0)
    sync.writeSyncStep2(encoder, doc, stateVector)
    const result = encoding.toUint8Array(encoder)
    bounded(result, collaborationLimits.frameBytes)

    return result
  } finally {
    doc.destroy()
  }
}

const trustedUser = z.strictObject({
  id: z.string().min(1).max(256),
  name: z.string().max(128),
})

const cursor = z
  .strictObject({ anchor: z.string().max(512), head: z.string().max(512) })
  .nullable()

const presenceState = z.strictObject({
  user: z.unknown().optional(),
  cursor: cursor.optional(),
})

export interface AwarenessOwner {
  clientId: number
  clock: number
  user: z.infer<typeof trustedUser>
}

export function validateAwareness(frame: Uint8Array, owner: AwarenessOwner) {
  bounded(frame, collaborationLimits.awarenessBytes)

  try {
    const decoder = decoding.createDecoder(frame)
    const count = decoding.readVarUint(decoder)

    if (count !== 1) throw new CollaborationError("invalid")
    const id = clientId(decoding.readVarUint(decoder))

    if (id !== clientId(owner.clientId)) throw new CollaborationError("denied")
    const clock = decoding.readVarUint(decoder)

    if (
      !Number.isSafeInteger(clock) ||
      clock <= owner.clock ||
      clock > 4294967295
    )
      throw new CollaborationError("invalid")
    const raw = decoding.readVarString(decoder)
    complete(decoder)
    const state: unknown = JSON.parse(raw)
    const parsed = state === null ? null : presenceState.parse(state)

    const normalized =
      parsed === null
        ? null
        : { user: trustedUser.parse(owner.user), cursor: parsed.cursor ?? null }

    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 1)
    encoding.writeVarUint(encoder, id)
    encoding.writeVarUint(encoder, clock)
    encoding.writeVarString(encoder, JSON.stringify(normalized))
    const payload = encoding.toUint8Array(encoder)
    bounded(payload, collaborationLimits.awarenessBytes)

    return { clock, payload }
  } catch (error) {
    if (error instanceof CollaborationError) throw error
    throw new CollaborationError("invalid")
  }
}

export function awarenessFrame(payload: Uint8Array) {
  bounded(payload, collaborationLimits.awarenessBytes)
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint8Array(encoder, payload)

  return encoding.toUint8Array(encoder)
}
