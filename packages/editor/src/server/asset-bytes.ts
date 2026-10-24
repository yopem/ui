import type { AssetByteStream } from "./asset-model"

import { AssetError, integer } from "./asset-model"

export async function readAssetBytes(
  body: AssetByteStream | null,
  limit: number,
  signal: AbortSignal,
  deadline = Date.now() + 30000,
) {
  if (!integer(limit, 1, 10485760) || !Number.isSafeInteger(deadline))
    throw new AssetError(400, "budget")

  if (!body) throw new AssetError(400, "body")
  signal.throwIfAborted()
  const reader = body.getReader()
  const result = new Uint8Array(limit)
  let size = 0

  function cancel() {
    void reader.cancel().catch(() => undefined)
  }

  signal.addEventListener("abort", cancel, { once: true })

  try {
    for (;;) {
      signal.throwIfAborted()

      if (Date.now() >= deadline) throw new AssetError(503, "deadline")
      const value = await reader.read()
      signal.throwIfAborted()

      if (Date.now() >= deadline) throw new AssetError(503, "deadline")

      if (value.done) break

      if (value.value.byteLength > limit - size)
        throw new AssetError(413, "size")
      result.set(value.value, size)
      size += value.value.byteLength
    }

    return result.subarray(0, size)
  } finally {
    signal.removeEventListener("abort", cancel)
    cancel()
  }
}

export async function assetDigest(bytes: Uint8Array) {
  const result = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes))

  return Array.from(new Uint8Array(result), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("")
}
