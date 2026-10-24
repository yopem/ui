import type { AssetRepository } from "./asset-repository"
import type { EditorAuthentication, EditorIdentity } from "./auth"

export interface ObjectRange {
  start: number
  end: number
}

export interface AssetByteStream {
  getReader(): {
    read(): Promise<
      { done: true; value?: Uint8Array } | { done: false; value: Uint8Array }
    >
    cancel(): Promise<void>
  }
  cancel(): Promise<void>
}

export interface PrivateObjects {
  put(
    key: string,
    bytes: Uint8Array,
    digest: string,
    signal: AbortSignal,
  ): Promise<void>
  get(
    key: string,
    range: ObjectRange | null,
    signal: AbortSignal,
  ): Promise<{ body: AssetByteStream; size: number } | null>
  delete(key: string, signal: AbortSignal): Promise<void>
  list(
    cursor: string | undefined,
    limit: number,
    signal: AbortSignal,
  ): Promise<{ keys: string[]; cursor?: string }>
}

export interface AssetAdmission {
  kind: "audio" | "video" | "file"
  mediaType: string
  maxBytes: number
  signature(this: void, bytes: Uint8Array): boolean
  validate(this: void, bytes: Uint8Array, signal: AbortSignal): Promise<boolean>
}

export interface AssetConfig {
  admissions?: readonly AssetAdmission[]
  repository: AssetRepository
  objects: PrivateObjects
  authenticate: EditorAuthentication
  policy(
    this: void,
    input: {
      request: Request
      identity: EditorIdentity
      documentId: string
      assetId?: string
      action: "upload:create" | "upload:read" | "upload:delete"
      signal: AbortSignal
    },
  ): Promise<true | false | "unavailable">
  verifyCsrf(this: void, request: Request): Promise<boolean>
  validateImage(
    this: void,
    bytes: Uint8Array,
    mediaType: string,
    signal: AbortSignal,
  ): Promise<boolean>
  allowedOrigins: readonly string[]
  maxConcurrent: number
  timeoutMs: number
  maxFileBytes: number
  maxTotalBytes: number
  maxAttempts: number
  maxPending: number
  cleanupIntervalMs: number
}

export class AssetError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code)
    this.name = "AssetError"
  }
}

export function objectKey(key: string) {
  if (!/^editor-attempts\/[a-f0-9]{64}$/.test(key))
    throw new AssetError(503, "object-key")

  return key
}

export function integer(value: number, min: number, max: number) {
  return Number.isSafeInteger(value) && value >= min && value <= max
}
