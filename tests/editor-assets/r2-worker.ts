import type { AssetR2Binding } from "@editor/server/asset-r2"

import { readAssetBytes } from "@editor/server/asset-bytes"
import { createR2Objects } from "@editor/server/asset-r2"

export default {
  async fetch(request: Request, env: { BUCKET: AssetR2Binding }) {
    const url = new URL(request.url)
    const key = url.searchParams.get("key") ?? ""
    const range = request.headers.get("Range")
    const parts = range ? /^bytes=(\d+)-(\d+)$/.exec(range) : null
    const objects = createR2Objects(env.BUCKET, { versioning: "disabled" })

    const result = await objects.get(
      key,
      parts ? { start: Number(parts[1]), end: Number(parts[2]) } : null,
      request.signal,
    )

    if (!result) return new Response(null, { status: 404 })
    const bytes = await readAssetBytes(result.body, 10485760, request.signal)

    return new Response(bytes, {
      headers: { "X-Object-Size": String(result.size) },
    })
  },
}
