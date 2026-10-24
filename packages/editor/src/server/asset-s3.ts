import { AwsClient } from "aws4fetch"

import type { ObjectRange, PrivateObjects } from "./asset-model"

import { readAssetBytes } from "./asset-bytes"
import { AssetError, integer, objectKey } from "./asset-model"

export interface AssetS3Config {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  versioning: "disabled"
  allowLoopback?: boolean
}

export function createS3Objects(config: AssetS3Config): PrivateObjects {
  const endpoint = new URL(config.endpoint)

  if (
    config.versioning !== "disabled" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== "/" ||
    (endpoint.protocol !== "https:" &&
      !(
        config.allowLoopback === true &&
        endpoint.protocol === "http:" &&
        endpoint.hostname === "127.0.0.1"
      )) ||
    !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(config.bucket) ||
    !/^[a-z0-9-]{1,64}$/.test(config.region) ||
    !config.accessKeyId ||
    !config.secretAccessKey
  )
    throw new AssetError(400, "config")

  const signer = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    sessionToken: config.sessionToken,
    service: "s3",
    region: config.region,
    retries: 0,
  })

  async function send(
    method: string,
    key: string | null,
    signal: AbortSignal,
    headers: Record<string, string> = {},
    bytes?: Uint8Array,
    query?: URLSearchParams,
  ) {
    signal.throwIfAborted()

    const url = new URL(
      `${endpoint.origin}/${config.bucket}/${key === null ? "" : objectKey(key)}`,
    )

    if (query) url.search = query.toString()

    try {
      const signed = await signer.sign(url, {
        method,
        headers,
        body: bytes ? new Uint8Array(bytes).buffer : undefined,
        signal,
        redirect: "error",
      })

      signal.throwIfAborted()
      const response = await fetch(signed, { signal, redirect: "error" })
      const version = response.headers.get("x-amz-version-id")

      if (version && version !== "null") {
        void response.body?.cancel()
        throw new AssetError(503, "versioning")
      }

      return response
    } catch {
      throw new AssetError(503, "object-unavailable")
    }
  }

  function accepted(response: Response, statuses: number[]) {
    if (!statuses.includes(response.status)) {
      void response.body?.cancel()
      throw new AssetError(503, "object-unavailable")
    }
  }

  return {
    async put(key, bytes, digest, signal) {
      if (!/^[a-f0-9]{64}$/.test(digest)) throw new AssetError(503, "digest")

      const response = await send(
        "PUT",
        key,
        signal,
        {
          "If-None-Match": "*",
          "Content-Type": "application/octet-stream",
          "x-amz-content-sha256": digest,
        },
        bytes,
      )

      accepted(response, [200])
      void response.body?.cancel()
    },
    async get(key, range: ObjectRange | null, signal) {
      const response = await send(
        "GET",
        key,
        signal,
        range ? { Range: `bytes=${range.start}-${range.end}` } : {},
      )

      if (response.status === 404) {
        void response.body?.cancel()

        return null
      }

      accepted(response, [range ? 206 : 200])
      let size = Number(response.headers.get("Content-Length"))

      if (range) {
        const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(
          response.headers.get("Content-Range") ?? "",
        )

        if (
          !match ||
          Number(match[1]) !== range.start ||
          Number(match[2]) !== range.end ||
          size !== range.end - range.start + 1
        ) {
          void response.body?.cancel()
          throw new AssetError(503, "object-range")
        }

        size = Number(match[3])
      }

      if (!integer(size, 1, 10485760) || !response.body) {
        void response.body?.cancel()
        throw new AssetError(503, "object-size")
      }

      return { body: response.body, size }
    },
    async delete(key, signal) {
      const response = await send("DELETE", key, signal)
      accepted(response, [200, 204, 404])
      void response.body?.cancel()
    },
    async list(cursor, limit, signal) {
      if (
        !integer(limit, 1, 100) ||
        (cursor !== undefined && cursor.length > 4096)
      )
        throw new AssetError(400, "invalid")

      const query = new URLSearchParams({
        "list-type": "2",
        prefix: "editor-attempts/",
        "max-keys": String(limit),
      })

      if (cursor) query.set("continuation-token", cursor)
      const response = await send("GET", null, signal, {}, undefined, query)
      accepted(response, [200])

      const text = new TextDecoder("utf-8", { fatal: true }).decode(
        await readAssetBytes(response.body, 65536, signal),
      )

      if (/<!|<Error[ >]/.test(text) || !/<ListBucketResult[ >]/.test(text))
        throw new AssetError(503, "object-list")

      const keys = Array.from(text.matchAll(/<Key>([^<]*)<\/Key>/g), (m) =>
        objectKey(m[1] ?? ""),
      )

      const truncated = text.includes("<IsTruncated>true</IsTruncated>")

      const next =
        /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(
          text,
        )?.[1]

      if (
        keys.length > limit ||
        (!truncated && !text.includes("<IsTruncated>false</IsTruncated>")) ||
        (truncated && (!next || next.length > 4096 || next.includes("&")))
      )
        throw new AssetError(503, "object-list")

      return { keys, cursor: truncated ? next : undefined }
    },
  }
}
