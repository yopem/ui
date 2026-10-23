import { z } from "zod"

import type { EditorIdentity } from "./auth"
import type { DocumentRow } from "./document-validation"

import { idSchema, envelopeSchema } from "./document-validation"

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface DocumentRecord {
  documentId: string
  generation: string
  revision: string
  mode: "snapshot"
  schemaVersion: number
  state: JsonValue | null
  deleted: boolean
  etag: string
}

export type ExpectedDocument =
  | { kind: "absent" }
  | { kind: "etag"; etag: string }

export interface DocumentContext {
  identity: EditorIdentity
  signal: AbortSignal
  deadline: number
}

export interface DocumentMutation {
  documentId: string
  expected: ExpectedDocument
  operationId: string
  change:
    | { kind: "save"; schemaVersion: number; state: string }
    | { kind: "delete" }
}

export type DocumentResult =
  | { status: "committed"; record: DocumentRecord }
  | { status: "conflict" }

export interface DocumentDriver {
  read(
    documentId: string,
    signal: AbortSignal,
    deadline?: number,
  ): Promise<unknown[]>
  mutate(
    input: PreparedDocumentMutation,
    signal: AbortSignal,
    deadline?: number,
  ): Promise<{ receipt: unknown[]; head: unknown[] }>
}

export interface PreparedDocumentMutation {
  documentId: string
  operationId: string
  expectedGeneration: string | null
  expectedRevision: string | null
  generation: string
  marker: string
  digest: string
  state: string | null
  schemaVersion: number
  deleted: number
}

export interface DocumentConfig {
  policy(
    this: void,
    input: {
      identity: EditorIdentity
      documentId: string
      action: "document:read" | "document:write" | "document:delete"
      signal: AbortSignal
    },
  ): Promise<true | false | "unavailable">
  validateState(this: void, state: JsonValue, schemaVersion: number): boolean
  maxConcurrent: number
  timeoutMs: number
}

export class DocumentError extends Error {
  constructor(
    public readonly code:
      | "invalid"
      | "denied"
      | "unavailable"
      | "aborted"
      | "uncertain"
      | "budget"
      | "corrupt"
      | "mode"
      | "exhausted"
      | "operation-reuse",
  ) {
    super(code)
    this.name = "DocumentError"
  }
}

export const maxRevision = 9223372036854775807n

const tagPattern = /^"([0-9a-f]{64}):([1-9][0-9]{0,18})"$/

export function documentId(value: string) {
  if (!idSchema.safeParse(value).success) throw new DocumentError("invalid")

  return value
}

export function parseExpected(expected: ExpectedDocument) {
  if (expected.kind === "absent") return { generation: null, revision: null }
  const match = tagPattern.exec(expected.etag)

  if (!match?.[1] || !match[2] || BigInt(match[2]) > maxRevision)
    throw new DocumentError("invalid")

  return { generation: match[1], revision: match[2] }
}

export function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

export function canonical(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`

  if (value instanceof Object)
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key] ?? null)}`)
      .join(",")}}`

  return JSON.stringify(value)
}

export function boundedState(
  raw: string,
  version: number,
  validate: DocumentConfig["validateState"],
): JsonValue {
  if (
    !z.string().max(1048576).safeParse(raw).success ||
    new TextEncoder().encode(raw).length > 1048576 ||
    !Number.isSafeInteger(version) ||
    version < 1 ||
    version > 2147483647
  )
    throw new DocumentError("invalid")
  let depth = 0
  let quoted = false
  let escaped = false

  for (const character of raw) {
    if (quoted) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === '"') quoted = false
    } else if (character === '"') quoted = true
    else if (character === "{" || character === "[") {
      if (++depth > 64) throw new DocumentError("budget")
    } else if (character === "}" || character === "]") depth--
  }

  let state: JsonValue

  try {
    state = z.json().parse(JSON.parse(raw))
  } catch {
    throw new DocumentError("invalid")
  }

  const pending: JsonValue[] = [state]
  let nodes = 0

  while (pending.length) {
    const value = pending.pop()

    if (++nodes > 131072) throw new DocumentError("budget")
    const text = z.string().safeParse(value)

    if (text.success && text.data.length > 1048576)
      throw new DocumentError("budget")

    if (value instanceof Object) {
      const children = Object.values(value)

      if (children.length + pending.length + nodes > 131072)
        throw new DocumentError("budget")
      pending.push(...children)
    }
  }

  if (!envelopeSchema.safeParse(state).success)
    throw new DocumentError("invalid")
  let valid = false

  try {
    valid = validate(state, version) === true
  } catch {
    throw new DocumentError("invalid")
  }

  if (!valid) throw new DocumentError("invalid")

  return state
}

export function decodeRecord(
  row: DocumentRow,
  config: DocumentConfig,
): DocumentRecord {
  if (row.mode === "yjs") throw new DocumentError("mode")
  let state: JsonValue | null = null

  if (row.deleted === 1) {
    if (row.state_json !== null) throw new DocumentError("corrupt")
  } else {
    if (row.state_json === null) throw new DocumentError("corrupt")
    state = boundedState(row.state_json, row.schema_version, (value, version) =>
      config.validateState(value, version),
    )
  }

  return {
    documentId: row.document_id,
    generation: row.generation,
    revision: row.revision,
    mode: "snapshot",
    schemaVersion: row.schema_version,
    state,
    deleted: row.deleted === 1,
    etag: `"${row.generation}:${row.revision}"`,
  }
}
