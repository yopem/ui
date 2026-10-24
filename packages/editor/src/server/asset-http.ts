import { z } from "zod"

import type { AssetConfig, ObjectRange } from "./asset-model"
import type { AssetOperation, AssetRow } from "./asset-repository"

import { assetDigest, readAssetBytes } from "./asset-bytes"
import { AssetError, integer } from "./asset-model"
import { documentId, randomToken } from "./document-model"
import { withinSignal } from "./document-service"
import { callableSchema, identitySchema } from "./document-validation"

const allowedHeaders = [
  "authorization",
  "content-type",
  "x-csrf-token",
  "x-editor-request",
  "x-file-name",
  "range",
]

function checkDeadline(signal: AbortSignal, deadline: number) {
  signal.throwIfAborted()

  if (Date.now() >= deadline) throw new AssetError(503, "deadline")
}

function safeName(name: string) {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\p{C}/\\";<>:*?|]/gu, "")
    .replace(/\.{2,}/g, "")
    .replace(/^[.\s]+|[.\s]+$/gu, "")

  const bounded =
    Array.from(cleaned)
      .slice(0, 100)
      .join("")
      .replace(/[.\s]+$/gu, "") || "download"

  return /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(bounded)
    ? `download-${bounded}`
    : bounded
}

function disposition(name: string, inline: boolean) {
  const encoded = encodeURIComponent(name).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )

  const ascii = name.replace(/[^\x20-\x7e]/g, "_")

  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

function parseRange(value: string | null, size: number): ObjectRange | null {
  if (value === null) return null
  const match = /^bytes=(\d{0,16})-(\d{0,16})$/.exec(value)

  if (!match || (!match[1] && !match[2])) throw new AssetError(416, "range")
  let start: number, end: number

  if (!match[1]) {
    const suffix = Number(match[2])

    if (!integer(suffix, 1, Number.MAX_SAFE_INTEGER))
      throw new AssetError(416, "range")
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Number(match[2]) : size - 1

    if (
      !integer(start, 0, size - 1) ||
      !integer(end, start, Number.MAX_SAFE_INTEGER)
    )
      throw new AssetError(416, "range")
    end = Math.min(end, size - 1)
  }

  return { start, end }
}

function magic(bytes: Uint8Array, type: string) {
  if (type === "image/png")
    return (
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
    )

  if (type === "image/jpeg")
    return (
      bytes.length >= 3 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255
    )

  return (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
}

const mediaTypes = {
  audio: ["audio/wav", "audio/mpeg", "audio/ogg"],
  video: ["video/webm", "video/mp4"],
}

function mediaSignature(bytes: Uint8Array, type: string) {
  if (type === "audio/wav")
    return (
      bytes.length >= 44 &&
      new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.subarray(8, 12)) === "WAVE"
    )

  if (type === "audio/ogg")
    return (
      bytes.length >= 27 &&
      new TextDecoder().decode(bytes.subarray(0, 4)) === "OggS"
    )

  if (type === "audio/mpeg")
    return (
      bytes.length >= 10 &&
      (new TextDecoder().decode(bytes.subarray(0, 3)) === "ID3" ||
        (bytes[0] === 255 && ((bytes[1] ?? 0) & 224) === 224))
    )

  if (type === "video/webm")
    return (
      bytes.length >= 16 &&
      [26, 69, 223, 163].every((byte, index) => bytes[index] === byte)
    )

  return (
    type === "video/mp4" &&
    bytes.length >= 24 &&
    new TextDecoder().decode(bytes.subarray(4, 8)) === "ftyp"
  )
}

export function createAssetHttpHandler(config: AssetConfig) {
  const admissions = config.admissions ?? []

  if (
    !z.array(z.unknown()).safeParse(admissions).success ||
    admissions.length > 32 ||
    new Set(admissions.map((entry) => entry.mediaType)).size !==
      admissions.length ||
    admissions.some(
      (entry) =>
        !z
          .object({
            kind: z.enum(["audio", "video", "file"]),
            mediaType: z
              .string()
              .max(127)
              .regex(
                /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/,
              ),
            maxBytes: z.number().int().min(1).max(config.maxFileBytes),
            signature: callableSchema,
            validate: callableSchema,
          })
          .safeParse(entry).success ||
        ["image/png", "image/jpeg", "image/webp"].includes(entry.mediaType) ||
        (entry.kind !== "file" &&
          !mediaTypes[entry.kind].includes(entry.mediaType)),
    )
  )
    throw new AssetError(400, "config")

  const admissionByType = new Map(
    admissions.map((entry) => [entry.mediaType, { ...entry }]),
  )

  if (
    !integer(config.maxConcurrent, 1, 64) ||
    !integer(config.timeoutMs, 1, 30000) ||
    !integer(config.maxFileBytes, 1, 10485760) ||
    config.maxConcurrent * config.maxFileBytes > 16777216 ||
    !integer(
      config.maxTotalBytes,
      config.maxFileBytes,
      Number.MAX_SAFE_INTEGER,
    ) ||
    !integer(config.maxAttempts, 1, 1000000) ||
    !integer(config.maxPending, 1, 64) ||
    !integer(config.cleanupIntervalMs, 1, 86400000) ||
    !config.allowedOrigins.length ||
    config.allowedOrigins.some((o) => {
      try {
        const u = new URL(o)

        return u.protocol !== "https:" || u.origin !== o
      } catch {
        return true
      }
    }) ||
    [
      config.authenticate,
      config.policy,
      config.verifyCsrf,
      config.validateImage,
    ].some((f) => !callableSchema.safeParse(f).success) ||
    !config.repository ||
    !config.objects
  )
    throw new AssetError(400, "config")
  const origins = new Set(config.allowedOrigins)
  let pending = 0

  async function bounded<T>(
    signal: AbortSignal,
    work: (signal: AbortSignal, deadline: number) => Promise<T>,
    deadlineCap?: number,
  ) {
    if (
      deadlineCap !== undefined &&
      !integer(deadlineCap, 1, Number.MAX_SAFE_INTEGER)
    )
      throw new AssetError(400, "invalid")

    const started = Date.now()

    const deadline = Math.min(
      started + config.timeoutMs,
      deadlineCap ?? Number.MAX_SAFE_INTEGER,
    )

    if (deadline <= started) throw new AssetError(503, "deadline")

    if (pending >= config.maxConcurrent) throw new AssetError(429, "budget")
    pending++
    const controller = new AbortController()

    const timer = setTimeout(
      () => controller.abort(),
      Math.min(deadline - Date.now(), 2147483647),
    )

    const combined = AbortSignal.any([signal, controller.signal])

    const task = Promise.resolve()
      .then(() => {
        checkDeadline(combined, deadline)

        return work(combined, deadline)
      })
      .finally(() => {
        pending--
        clearTimeout(timer)
      })

    try {
      return await withinSignal(task, combined)
    } catch (error) {
      if (error instanceof AssetError) throw error
      throw new AssetError(503, combined.aborted ? "aborted" : "unavailable")
    }
  }

  async function handle(request: Request) {
    const cors = new Headers({
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      Vary: "Origin, Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest, Sec-Fetch-User, Referer",
    })

    try {
      const origin = request.headers.get("Origin")

      if (origin !== null) {
        if (!origins.has(origin)) throw new AssetError(403, "origin")
        cors.set("Access-Control-Allow-Origin", origin)
        cors.set("Access-Control-Allow-Credentials", "true")
        cors.set(
          "Access-Control-Expose-Headers",
          "Content-Range, Content-Disposition",
        )
      } else {
        const target = new URL(request.url)
        const mode = request.headers.get("Sec-Fetch-Mode")
        const dest = request.headers.get("Sec-Fetch-Dest")
        const user = request.headers.get("Sec-Fetch-User")
        const referer = request.headers.get("Referer")

        if (
          request.method !== "GET" ||
          target.protocol !== "https:" ||
          !origins.has(target.origin) ||
          request.headers.get("Sec-Fetch-Site") !== "same-origin" ||
          (referer !== null &&
            (!URL.canParse(referer) ||
              new URL(referer).origin !== target.origin)) ||
          !(
            (user === null &&
              ((dest === "empty" &&
                (mode === "cors" || mode === "same-origin")) ||
                ((dest === "image" ||
                  ((dest === "audio" || dest === "video") &&
                    referer !== null)) &&
                  mode === "no-cors"))) ||
            (mode === "navigate" &&
              ((dest === "document" && user === "?1") ||
                (dest === "empty" && user === null && referer !== null)))
          )
        )
          throw new AssetError(403, "origin")
      }

      let headerBytes = 0

      for (const [key, value] of request.headers)
        headerBytes += new TextEncoder().encode(key + value).length

      if (headerBytes > 32768) throw new AssetError(431, "headers")
      const url = new URL(request.url)

      const path = /^\/editor\/documents\/([^/]+)\/assets(?:\/([^/]+))?$/.exec(
        url.pathname,
      )

      if (!path?.[1] || url.search || url.hash)
        throw new AssetError(400, "path")
      let id: string

      try {
        id = documentId(decodeURIComponent(path[1]))
      } catch {
        throw new AssetError(400, "document-id")
      }

      const assetId = path[2]

      if (assetId && !z.uuid().safeParse(assetId).success)
        throw new AssetError(400, "asset-id")

      if (request.method === "OPTIONS") {
        const method = request.headers.get("Access-Control-Request-Method")

        const headers = (
          request.headers.get("Access-Control-Request-Headers") ?? ""
        )
          .split(",")
          .map((h) => h.trim().toLowerCase())
          .filter(Boolean)

        if (
          !method ||
          !["GET", "POST", "DELETE"].includes(method) ||
          headers.some((h) => !allowedHeaders.includes(h))
        )
          throw new AssetError(403, "preflight")
        cors.set("Access-Control-Allow-Methods", "GET, POST, DELETE")
        cors.set("Access-Control-Allow-Headers", allowedHeaders.join(", "))

        return new Response(null, { status: 204, headers: cors })
      }

      const action =
        request.method === "POST" && !assetId
          ? "upload:create"
          : request.method === "GET" && assetId
            ? "upload:read"
            : request.method === "DELETE" && assetId
              ? "upload:delete"
              : null

      if (!action) throw new AssetError(405, "method")
      const policyAction = action

      return await bounded(request.signal, async function serve(signal, until) {
        const authenticationInit = {
          signal,
          body: request.body,
          duplex: "half" as const,
        }

        const authenticationRequest = new Request(request, authenticationInit)
        const authentication = await config.authenticate(authenticationRequest)
        signal.throwIfAborted()

        if (Date.now() >= until) throw new AssetError(503, "deadline")

        if (authentication.status === "unavailable")
          throw new AssetError(503, "authentication")

        if (
          authentication.status !== "authenticated" ||
          !identitySchema.safeParse(authentication.identity).success ||
          !integer(
            authentication.credentialExpiresAt ?? 0,
            Date.now() + 1,
            Number.MAX_SAFE_INTEGER,
          )
        )
          throw new AssetError(401, "authentication")
        const credentialExpiresAt = authentication.credentialExpiresAt

        if (credentialExpiresAt === undefined)
          throw new AssetError(401, "authentication")
        const expires = credentialExpiresAt
        const identity = authentication.identity
        const expiryController = new AbortController()

        const expiryTimer = setTimeout(
          () => expiryController.abort(),
          Math.min(expires - Date.now(), 2147483647),
        )

        const authorizedSignal = AbortSignal.any([
          signal,
          expiryController.signal,
        ])

        const operation: AssetOperation = {
          signal: authorizedSignal,
          deadline: Math.min(until, expires),
        }

        function active() {
          authorizedSignal.throwIfAborted()

          if (Date.now() >= expires) throw new AssetError(401, "expired")

          checkDeadline(authorizedSignal, until)
        }

        const authorizedInit = {
          signal: authorizedSignal,
          body: authenticationRequest.body,
          duplex: "half" as const,
        }

        const authorizedRequest = new Request(
          authenticationRequest,
          authorizedInit,
        )

        async function check(row?: AssetRow) {
          active()

          const allowed = await config.policy({
            request: authorizedRequest,
            identity,
            documentId: id,
            action: policyAction,
            signal: authorizedSignal,
            assetId: row?.asset_id,
          })

          active()

          if (Date.now() >= expires) throw new AssetError(401, "expired")

          if (allowed !== true)
            throw new AssetError(allowed === false ? 403 : 503, "policy")
        }

        try {
          await check()

          if (action !== "upload:read") {
            if (
              request.headers.get("X-Editor-Request") !== "1" ||
              (await config.verifyCsrf(authorizedRequest)) !== true
            )
              throw new AssetError(403, "csrf")
            active()
          }

          if (action === "upload:create") {
            const type = request.headers.get("Content-Type") ?? ""

            const admission = admissionByType.get(type)

            if (
              (!admission &&
                !["image/png", "image/jpeg", "image/webp"].includes(type)) ||
              request.headers.has("Content-Encoding")
            )
              throw new AssetError(415, "media-type")
            const maxBytes = admission?.maxBytes ?? config.maxFileBytes
            const length = request.headers.get("Content-Length")

            if (
              length !== null &&
              (!/^\d+$/.test(length) || !integer(Number(length), 1, maxBytes))
            )
              throw new AssetError(413, "size")

            const generation = await config.repository.head(id, operation)
            active()

            if (!generation) throw new AssetError(404, "document")
            let row: AssetRow | null = null
            let ready = false

            try {
              row = await config.repository.reserve(
                {
                  documentId: id,
                  generation,
                  assetId: crypto.randomUUID(),
                  attemptId: randomToken(),
                  mediaType: type,
                  mediaKind: admission?.kind ?? "image",
                  name: safeName(
                    request.headers.get("X-File-Name") ?? "download",
                  ),
                  now: Date.now(),
                  leaseUntil: Math.min(Date.now() + config.timeoutMs, expires),
                  bytes: maxBytes,
                  maxBytes: config.maxTotalBytes,
                  maxAttempts: config.maxAttempts,
                  maxPending: config.maxPending,
                },
                operation,
              )
              active()

              if (!row) throw new AssetError(429, "quota-or-generation")

              const bytes = await readAssetBytes(
                authorizedRequest.body,
                maxBytes,
                authorizedSignal,
                Math.min(until, expires),
              )

              if (length !== null && Number(length) !== bytes.length)
                throw new AssetError(400, "length")

              if (
                !bytes.length ||
                (admission
                  ? (admission.kind !== "file" &&
                      !mediaSignature(bytes, type)) ||
                    admission.signature(bytes) !== true ||
                    (await admission.validate(bytes, authorizedSignal)) !== true
                  : !magic(bytes, type) ||
                    (await config.validateImage(
                      bytes,
                      type,
                      authorizedSignal,
                    )) !== true)
              )
                throw new AssetError(415, "image")
              active()
              const digest = await assetDigest(bytes)
              active()
              await config.objects.put(
                row.object_key,
                bytes,
                digest,
                authorizedSignal,
              )
              await check(row)

              const promoted = await config.repository.promote(
                row,
                bytes.length,
                digest,
                Date.now(),
                operation,
              )

              active()

              if (!promoted) throw new AssetError(409, "generation-or-terminal")
              ready = true

              return new Response(
                JSON.stringify({
                  assetId: row.asset_id,
                  url: `/editor/documents/${encodeURIComponent(id)}/assets/${row.asset_id}`,
                }),
                {
                  status: 201,
                  headers: new Headers([
                    ...cors,
                    ["Content-Type", "application/json"],
                  ]),
                },
              )
            } finally {
              if (row && !ready)
                await config.repository.terminal(row.attempt_id, {
                  signal: new AbortController().signal,
                  deadline: Date.now() + config.timeoutMs,
                })
            }
          }

          if (!assetId) throw new AssetError(400, "asset-id")
          const row = await config.repository.read(id, assetId, operation)
          active()

          if (!row) throw new AssetError(404, "asset")
          await check(row)

          if (action === "upload:delete") {
            if (
              !(await config.repository.remove(id, assetId, expires, operation))
            )
              throw new AssetError(401, "expired")
            active()

            return new Response(null, { status: 204, headers: cors })
          }

          if (row.status !== "ready") throw new AssetError(404, "asset")
          const nativeDestination = request.headers.get("Sec-Fetch-Dest")

          if (
            (nativeDestination === "image" ||
              nativeDestination === "audio" ||
              nativeDestination === "video") &&
            nativeDestination !== row.media_kind
          )
            throw new AssetError(403, "destination")

          if (
            (row.media_kind === "audio" || row.media_kind === "video") &&
            !mediaTypes[row.media_kind].includes(row.media_type)
          )
            throw new AssetError(503, "corrupt")
          let range: ObjectRange | null

          try {
            range = parseRange(request.headers.get("Range"), row.byte_size)
          } catch (error) {
            cors.set("Content-Range", `bytes */${row.byte_size}`)
            throw error
          }

          active()

          const object = await config.objects.get(
            row.object_key,
            range,
            authorizedSignal,
          )

          active()

          if (!object) throw new AssetError(503, "object-missing")

          if (object.size !== row.byte_size) {
            void object.body.cancel()
            throw new AssetError(503, "object-size")
          }

          const expected = range ? range.end - range.start + 1 : row.byte_size

          const bytes = await readAssetBytes(
            object.body,
            expected,
            authorizedSignal,
            Math.min(until, expires),
          )

          if (
            bytes.length !== expected ||
            (expected === row.byte_size &&
              (await assetDigest(bytes)) !== row.sha256)
          )
            throw new AssetError(503, "object-integrity")
          await check(row)
          const current = await config.repository.read(id, assetId, operation)
          active()

          if (
            current?.status !== "ready" ||
            current.attempt_id !== row.attempt_id
          )
            throw new AssetError(404, "asset")
          const headers = new Headers(cors)
          headers.set(
            "Content-Type",
            row.media_kind === "file"
              ? "application/octet-stream"
              : row.media_type,
          )
          headers.set("Content-Length", String(expected))
          headers.set(
            "Content-Disposition",
            disposition(
              safeName(row.safe_name),
              row.media_kind === "audio" || row.media_kind === "video",
            ),
          )
          headers.set("Accept-Ranges", "bytes")

          if (range)
            headers.set(
              "Content-Range",
              `bytes ${range.start}-${range.end}/${row.byte_size}`,
            )

          return new Response(bytes, { status: range ? 206 : 200, headers })
        } finally {
          clearTimeout(expiryTimer)
        }
      })
    } catch (error) {
      const safe =
        error instanceof AssetError ? error : new AssetError(503, "unavailable")

      cors.set("Content-Type", "application/json")

      return new Response(JSON.stringify({ code: safe.code }), {
        status: safe.status,
        headers: cors,
      })
    }
  }

  function cleanup(input: {
    batchSize: number
    signal: AbortSignal
    deadline?: number
  }) {
    return bounded(
      input.signal,
      async function clean(signal, deadline) {
        if (!integer(input.batchSize, 1, 100))
          throw new AssetError(400, "invalid")

        const operation = { signal, deadline }
        checkDeadline(signal, deadline)

        const claims = await config.repository.claim(
          Date.now(),
          input.batchSize,
          config.timeoutMs,
          operation,
        )

        checkDeadline(signal, deadline)

        let deleted = 0

        for (const row of claims) {
          checkDeadline(signal, deadline)
          await config.objects.delete(row.object_key, signal)
          checkDeadline(signal, deadline)

          if (
            await config.repository.ack(
              row.attempt_id,
              row.claim_token,
              Date.now() + config.cleanupIntervalMs,
              operation,
            )
          )
            deleted++

          checkDeadline(signal, deadline)
        }

        return { deleted, claimed: claims.length }
      },
      input.deadline,
    )
  }

  function reconcile(input: {
    limit: number
    cursor?: string
    signal: AbortSignal
    deadline?: number
  }) {
    return bounded(
      input.signal,
      async function inventory(signal, deadline) {
        if (
          !integer(input.limit, 1, 100) ||
          (input.cursor !== undefined && input.cursor.length > 4096)
        )
          throw new AssetError(400, "invalid")

        checkDeadline(signal, deadline)

        const page = await config.objects.list(
          input.cursor,
          input.limit,
          signal,
        )

        checkDeadline(signal, deadline)

        let unknown = 0,
          terminal = 0

        const operation = { signal, deadline }

        for (const key of page.keys) {
          checkDeadline(signal, deadline)
          const row = await config.repository.key(key, operation)
          checkDeadline(signal, deadline)

          if (!row) unknown++
          else if (row.status === "terminal") terminal++
        }

        return {
          examined: page.keys.length,
          unknown,
          terminal,
          cursor: page.cursor,
        }
      },
      input.deadline,
    )
  }

  return { handle, cleanup, reconcile }
}
