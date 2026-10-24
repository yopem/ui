import type { AssetByteStream, PrivateObjects } from "./asset-model"

import { AssetError, integer, objectKey } from "./asset-model"

export interface AssetR2Binding {
  put(
    key: string,
    bytes: Uint8Array,
    options: { onlyIf: { etagDoesNotMatch: string }; sha256: ArrayBuffer },
  ): Promise<{ key: string; etag: string } | null>
  get(
    key: string,
    options: {
      onlyIf: Record<string, never>
      range?: { offset: number; length: number }
    },
  ): Promise<{ body?: AssetByteStream; size: number } | null>
  delete(key: string): Promise<void>
  list(options: { prefix: string; limit: number; cursor?: string }): Promise<{
    objects: { key: string }[]
    truncated: boolean
    cursor?: string
  }>
}

export function createR2Objects(
  bucket: AssetR2Binding,
  config: { versioning: "disabled" },
): PrivateObjects {
  if (config.versioning !== "disabled") throw new AssetError(400, "versioning")

  return {
    async put(key, bytes, digest, signal) {
      signal.throwIfAborted()
      objectKey(key)

      if (!/^[a-f0-9]{64}$/.test(digest)) throw new AssetError(503, "digest")

      const checksum = Uint8Array.from(digest.match(/../g) ?? [], (v) =>
        Number.parseInt(v, 16),
      ).buffer

      const result = await bucket.put(key, bytes, {
        onlyIf: { etagDoesNotMatch: "*" },
        sha256: checksum,
      })

      if (result === null) throw new AssetError(503, "object-conflict")
      signal.throwIfAborted()
    },
    async get(key, range, signal) {
      signal.throwIfAborted()

      const result = await bucket.get(
        objectKey(key),
        range
          ? {
              onlyIf: {},
              range: {
                offset: range.start,
                length: range.end - range.start + 1,
              },
            }
          : { onlyIf: {} },
      )

      signal.throwIfAborted()

      if (!result) return null

      if (!result.body) throw new AssetError(503, "object-body")

      return { body: result.body, size: result.size }
    },
    async delete(key, signal) {
      signal.throwIfAborted()
      await bucket.delete(objectKey(key))
      signal.throwIfAborted()
    },
    async list(cursor, limit, signal) {
      signal.throwIfAborted()

      if (!integer(limit, 1, 100)) throw new AssetError(400, "invalid")

      const result = await bucket.list({
        prefix: "editor-attempts/",
        limit,
        cursor,
      })

      signal.throwIfAborted()

      if (result.objects.length > limit || (result.truncated && !result.cursor))
        throw new AssetError(503, "object-list")

      return {
        keys: result.objects.map((o) => objectKey(o.key)),
        cursor: result.truncated ? result.cursor : undefined,
      }
    },
  }
}
