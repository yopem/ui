import type { AssetConfig, PrivateObjects } from "@editor/server/asset-model"
import type { AuthenticationResult } from "@editor/server/auth"
import type { DocumentPgPool } from "@editor/server/document-postgres"

import { assetDigest, readAssetBytes } from "@editor/server/asset-bytes"
import { createAssetHttpHandler } from "@editor/server/asset-http"
import { createR2Objects } from "@editor/server/asset-r2"
import {
  createD1AssetRepository,
  createPostgresAssetRepository,
} from "@editor/server/asset-repository"
import { createS3Objects } from "@editor/server/asset-s3"
import { PGlite } from "@electric-sql/pglite"
import { AwsV4Signer } from "aws4fetch"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Miniflare } from "miniflare"
import { readFile } from "node:fs/promises"
import { z } from "zod"

import { mediaAudio, mediaFile, mediaVideo } from "./media-fixtures"
import { mediaPolicies } from "./media-policies"

const generation = "a".repeat(64)

const origin = "https://host.example"

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])

function request(
  id: string,
  method = "POST",
  body: Uint8Array = png,
  headers: Record<string, string> = {},
) {
  const init: RequestInit = {
    method,
    headers: {
      Origin: origin,
      "X-Editor-Request": "1",
      "X-CSRF-Token": "fixture",
      "Content-Type": "image/png",
      ...headers,
    },
  }

  if (method === "POST") init.body = new Uint8Array(body).buffer

  return new Request(
    `https://host.example/editor/documents/tenant:${id}/assets`,
    init,
  )
}

function config(
  repository: AssetConfig["repository"],
  objects: PrivateObjects,
): AssetConfig {
  return {
    repository,
    objects,
    allowedOrigins: [origin],
    maxConcurrent: 8,
    timeoutMs: 10000,
    maxFileBytes: 1024,
    maxTotalBytes: 8192,
    maxAttempts: 16,
    maxPending: 4,
    cleanupIntervalMs: 10,
    authenticate: function authenticate() {
      return Promise.resolve<AuthenticationResult>({
        status: "authenticated",
        identity: { provider: "openauth", userId: "user" },
        credentialExpiresAt: Date.now() + 30000,
      })
    },
    policy: function policy() {
      return Promise.resolve(true)
    },
    verifyCsrf: function csrf(req) {
      return Promise.resolve(req.headers.get("X-CSRF-Token") === "fixture")
    },
    validateImage: function validate(bytes, type) {
      return Promise.resolve(
        bytes.length === png.length && type === "image/png",
      )
    },
  }
}

function barrier() {
  return Promise.withResolvers<void>()
}

for (const dialect of ["d1", "postgres"] as const) {
  describe(dialect, function suite() {
    let mf: Miniflare
    let pg: PGlite
    let repository: AssetConfig["repository"]
    let objects: PrivateObjects
    let sql: (text: string) => Promise<unknown[]>
    let bucket: Awaited<ReturnType<Miniflare["getR2Bucket"]>>
    let legacyRows: unknown[]

    const legacyColumns =
      "asset_id,attempt_id,document_id,generation,object_key,status,reserved_bytes,byte_size,media_type,safe_name,sha256,lease_until,next_probe_at,claim_token,created_at"

    const legacyId = "11111111-1111-4111-8111-111111111111"
    const legacyKey = `editor-attempts/${"1".repeat(64)}`
    beforeAll(async function setup() {
      const build = await Bun.build({
        entrypoints: [new URL("./r2-worker.ts", import.meta.url).pathname],
        target: "browser",
        minify: true,
      })

      const output = build.outputs[0]

      if (!build.success || !output) throw new Error("worker-build")
      const worker = await output.text()
      mf = new Miniflare({
        workers: [
          {
            config: {
              name: `assets-${dialect}`,
              compatibilityDate: "2026-09-01",
              manifest: {
                mainModule: "worker.js",
                modules: {
                  "worker.js": {
                    type: "esm",
                    contents: worker,
                  },
                },
              },
              env: {
                DB: { type: "d1", id: `assets-${dialect}` },
                BUCKET: { type: "r2", name: `assets-${dialect}` },
              },
            },
          },
        ],
      })
      bucket = await mf.getR2Bucket("BUCKET")
      const bindingObjects = createR2Objects(bucket, { versioning: "disabled" })
      objects = {
        ...bindingObjects,
        async get(key, range, signal) {
          signal.throwIfAborted()
          const url = new URL(await mf.ready)
          url.searchParams.set("key", key)
          const headers: Record<string, string> = {}

          if (range) headers.Range = `bytes=${range.start}-${range.end}`
          const response = await fetch(url, { headers, signal })

          if (response.status === 404) return null
          const bytes = new Uint8Array(await response.arrayBuffer())
          const body = new Response(bytes).body

          if (!body) throw new Error("fixture-body")

          return { body, size: Number(response.headers.get("X-Object-Size")) }
        },
      }

      if (dialect === "d1") {
        const db = await mf.getD1Database("DB")
        sql = async function query(text) {
          return (await db.prepare(text).all()).results
        }

        const migration1 = await readFile(
          new URL(
            `../../packages/editor/src/server/migrations/d1/0001-document-snapshots.sql`,
            import.meta.url,
          ),
          "utf8",
        )

        await db.batch(
          migration1
            .split(";")
            .filter((s) => s.trim())
            .map((s) => db.prepare(s)),
        )

        const migration2 = await readFile(
          new URL(
            `../../packages/editor/src/server/migrations/d1/0002-private-assets.sql`,
            import.meta.url,
          ),
          "utf8",
        )

        await db.exec(migration2)
        repository = createD1AssetRepository(db)
      } else {
        pg = new PGlite()

        for (const name of [
          "0001-document-snapshots.sql",
          "0002-private-assets.sql",
        ])
          await pg.exec(
            await readFile(
              new URL(
                `../../packages/editor/src/server/migrations/postgres/${name}`,
                import.meta.url,
              ),
              "utf8",
            ),
          )
        sql = async function query(text) {
          return (await pg.query(text)).rows
        }

        let previous = Promise.resolve()

        const pool: DocumentPgPool = {
          async connect() {
            const ready = previous
            const done = barrier()
            previous = done.promise
            await ready

            return {
              query: (c) => pg.query(c.text, c.values),
              release() {
                done.resolve()
              },
            }
          },
        }

        repository = createPostgresAssetRepository(pool, {
          timeoutMs: 3000,
          maxConcurrent: 8,
        })
      }

      await document("upgrade")
      const digest = await assetDigest(png)
      await objects.put(legacyKey, png, digest, new AbortController().signal)
      await sql(
        `INSERT INTO editor_assets(${legacyColumns}) VALUES('${legacyId}','${"1".repeat(64)}','tenant:upgrade','${generation}','${legacyKey}','ready',1024,${png.length},'image/png','legacy.png','${digest}',0,0,'',1)`,
      )
      legacyRows = await sql(`SELECT ${legacyColumns} FROM editor_assets`)

      const migration = await readFile(
        new URL(
          `../../packages/editor/src/server/migrations/${dialect === "d1" ? "d1" : "postgres"}/0003-general-assets.sql`,
          import.meta.url,
        ),
        "utf8",
      )

      if (dialect === "d1") await (await mf.getD1Database("DB")).exec(migration)
      else await pg.exec(migration)
    }, 30000)
    afterAll(async function close() {
      if (pg) await pg.close()

      if (mf) await mf.dispose()
    }, 30000)

    async function document(id: string) {
      await sql(
        `INSERT INTO editor_documents VALUES('tenant:${id}','${generation}',1,'snapshot','{"root":{"type":"root","children":[]}}',1,0,'${"b".repeat(64)}')`,
      )
    }

    async function reset() {
      await sql("DELETE FROM editor_assets")
    }

    test("general migration retains existing image bytes, immutable attempt and lifetime reservation", async function upgrade() {
      expect(await sql(`SELECT ${legacyColumns} FROM editor_assets`)).toEqual(
        legacyRows,
      )
      expect(await sql("SELECT media_kind FROM editor_assets")).toEqual([
        { media_kind: "image" },
      ])
      const service = createAssetHttpHandler(config(repository, objects))
      const url = `${origin}/editor/documents/tenant:upgrade/assets/${legacyId}`

      const response = await service.handle(
        new Request(url, { headers: { Origin: origin } }),
      )

      expect(response.status).toBe(200)
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(png)
      expect(
        (
          await service.handle(
            new Request(url, {
              method: "DELETE",
              headers: {
                Origin: origin,
                "X-Editor-Request": "1",
                "X-CSRF-Token": "fixture",
              },
            }),
          )
        ).status,
      ).toBe(204)
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
      expect(
        await sql("SELECT reserved_bytes,attempt_id,status FROM editor_assets"),
      ).toEqual([
        {
          reserved_bytes: 1024,
          attempt_id: "1".repeat(64),
          status: "terminal",
        },
      ])
    }, 30000)

    test("validated general assets retain authorization, range and download contracts", async function general() {
      await reset()
      await document("general")
      const cfg = config(repository, objects)
      cfg.maxFileBytes = 8192
      cfg.maxTotalBytes = 131072
      cfg.admissions = mediaPolicies()
      const service = createAssetHttpHandler(cfg)

      for (const [type, bytes, kind] of [
        ["audio/wav", mediaAudio, "audio"],
        ["video/webm", mediaVideo, "video"],
        ["text/html", mediaFile, "file"],
      ] as const) {
        const uploaded = await service.handle(
          request("general", "POST", bytes, {
            "Content-Type": type,
            "X-File-Name": '../unsafe;".html',
          }),
        )

        expect(uploaded.status).toBe(201)
        const asset = z.object({ url: z.string() }).parse(await uploaded.json())

        const get = new Request(`https://host.example${asset.url}`, {
          headers: { Origin: origin },
        })

        const full = await service.handle(get)
        expect(full.status).toBe(200)
        expect(Buffer.from(await full.arrayBuffer())).toEqual(bytes)
        expect(full.headers.get("Content-Type")).toBe(
          kind === "file" ? "application/octet-stream" : type,
        )
        expect(full.headers.get("Content-Disposition")).toStartWith(
          kind === "file" ? "attachment;" : "inline;",
        )
        expect(full.headers.get("Content-Disposition")).not.toContain("../")
        expect(full.headers.get("X-Content-Type-Options")).toBe("nosniff")
        expect(full.headers.get("Cache-Control")).toBe("private, no-store")

        for (const range of [
          "bytes=0-0",
          "bytes=1-",
          "bytes=-2",
          "bytes=0-999999",
        ]) {
          const partial = await service.handle(
            new Request(get, { headers: { Origin: origin, Range: range } }),
          )

          expect(partial.status).toBe(206)
          const data = new Uint8Array(await partial.arrayBuffer())
          expect(Number(partial.headers.get("Content-Length"))).toBe(
            data.length,
          )

          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(
            partial.headers.get("Content-Range") ?? "",
          )

          expect(match).not.toBeNull()

          if (!match) throw new Error("range")
          expect(data).toEqual(
            new Uint8Array(
              bytes.subarray(Number(match[1]), Number(match[2]) + 1),
            ),
          )
          expect(Number(match[3])).toBe(bytes.length)
        }

        for (const range of [
          "bytes=-0",
          "bytes=2-1",
          `bytes=${bytes.length}-`,
          "bytes=0-1,3-4",
          "bytes=9007199254740992-",
          `bytes=${"0".repeat(1000)}-1`,
        ]) {
          expect(
            (
              await service.handle(
                new Request(get, { headers: { Origin: origin, Range: range } }),
              )
            ).status,
          ).toBe(416)
        }

        const native = new Request(get, {
          headers: {
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Dest": kind,
            Referer: origin + "/",
          },
        })

        expect((await service.handle(native)).status).toBe(
          kind === "file" ? 403 : 200,
        )

        for (const override of [
          { "Sec-Fetch-Site": "same-site" },
          { "Sec-Fetch-Mode": "navigate" },
          { "Sec-Fetch-Dest": "iframe" },
          { "Sec-Fetch-Dest": kind === "audio" ? "video" : "audio" },
          { "Sec-Fetch-User": "?1" },
          { Referer: "https://sibling.example/" },
        ]) {
          const headers = new Headers(native.headers)

          for (const [key, value] of Object.entries(override))
            headers.set(key, value)
          expect(
            (await service.handle(new Request(native, { headers }))).status,
          ).toBe(403)
        }

        const imageHeaders = new Headers(native.headers)
        imageHeaders.set("Sec-Fetch-Dest", "image")
        expect(
          (await service.handle(new Request(native, { headers: imageHeaders })))
            .status,
        ).toBe(403)
        imageHeaders.set("Origin", origin)
        expect(
          (await service.handle(new Request(native, { headers: imageHeaders })))
            .status,
        ).toBe(403)
        const noReferer = new Headers(native.headers)
        noReferer.delete("Referer")
        expect(
          (await service.handle(new Request(native, { headers: noReferer })))
            .status,
        ).toBe(403)
        expect(
          (await service.handle(new Request(get, { method: "HEAD" }))).status,
        ).toBe(405)
        cfg.policy = () => Promise.resolve(false)

        const denied = await service.handle(
          new Request(get, {
            headers: { Origin: origin, Range: "bytes=invalid" },
          }),
        )

        expect(denied.status).toBe(403)
        expect(denied.headers.has("Content-Range")).toBe(false)
        cfg.policy = () => Promise.resolve("unavailable")
        expect((await service.handle(get)).status).toBe(503)
        cfg.policy = () => Promise.resolve(true)
        expect(
          (
            await service.handle(
              new Request(get, {
                method: "DELETE",
                headers: {
                  Origin: origin,
                  "X-Editor-Request": "1",
                  "X-CSRF-Token": "fixture",
                },
              }),
            )
          ).status,
        ).toBe(204)
      }

      for (const [type, bytes] of [
        ["audio/wav", mediaVideo],
        ["video/webm", mediaAudio],
        ["audio/mpeg", mediaAudio],
        ["image/svg+xml", mediaFile],
        ["text/html", mediaFile.subarray(0, 18)],
        ["audio/wav", mediaAudio.subarray(0, 16)],
      ] as const) {
        expect(
          (
            await service.handle(
              request("general", "POST", bytes, { "Content-Type": type }),
            )
          ).status,
        ).toBe(415)
      }

      expect(
        (
          await service.handle(
            request("general", "POST", mediaAudio, {
              "Content-Type": "audio/wav",
              "Content-Encoding": "gzip",
            }),
          )
        ).status,
      ).toBe(415)
      expect(
        (
          await service.handle(
            request("general", "POST", mediaAudio, {
              "Content-Type": "audio/wav",
              "Content-Length": "3",
            }),
          )
        ).status,
      ).toBe(400)
      expect(
        (
          await service.handle(
            request("general", "POST", mediaFile, {
              "Content-Type": "text/html",
              Origin: "https://sibling.example",
            }),
          )
        ).status,
      ).toBe(403)
      expect(
        (
          await service.handle(
            request("general", "POST", mediaFile, {
              "Content-Type": "text/html",
              "X-CSRF-Token": "wrong",
            }),
          )
        ).status,
      ).toBe(403)
      const first = cfg.admissions[0]

      if (!first) throw new Error("policy")
      cfg.admissions = [{ ...first, maxBytes: 8 }]
      const small = createAssetHttpHandler(cfg)
      expect(
        (
          await small.handle(
            request("general", "POST", mediaAudio, {
              "Content-Type": "audio/wav",
            }),
          )
        ).status,
      ).toBe(413)
      cfg.admissions = [
        {
          ...first,
          validate: () => Promise.reject(new Error("scanner offline")),
        },
      ]
      expect(
        (
          await createAssetHttpHandler(cfg).handle(
            request("general", "POST", mediaAudio, {
              "Content-Type": "audio/wav",
            }),
          )
        ).status,
      ).toBe(503)
      cfg.admissions = [{ ...first, signature: () => false }]
      expect(
        (
          await createAssetHttpHandler(cfg).handle(
            request("general", "POST", mediaAudio, {
              "Content-Type": "audio/wav",
            }),
          )
        ).status,
      ).toBe(415)
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)

      for (const admissions of [
        [first, first],
        [{ ...first, mediaType: "text/html" }],
        [{ ...first, maxBytes: 0 }],
      ]) {
        expect(() => createAssetHttpHandler({ ...cfg, admissions })).toThrow()
      }
    }, 60000)

    test("general media reader access, cancellation, late PUT and terminal reconciliation", async function generalLifecycle() {
      for (const [kind, type, bytes] of [
        ["audio", "audio/wav", mediaAudio],
        ["video", "video/webm", mediaVideo],
        ["file", "text/html", mediaFile],
      ] as const) {
        await reset()
        const id = `lifecycle-${kind}`
        await document(id)
        const cfg = config(repository, objects)
        cfg.maxFileBytes = 8192
        cfg.maxTotalBytes = 131072
        cfg.admissions = mediaPolicies()
        const service = createAssetHttpHandler(cfg)
        const headers = { "Content-Type": type }

        const uploaded = await service.handle(
          request(id, "POST", bytes, headers),
        )

        expect(uploaded.status).toBe(201)

        const { url } = z
          .object({ url: z.string() })
          .parse(await uploaded.json())

        cfg.policy = (input) => Promise.resolve(input.action === "upload:read")
        expect(
          (
            await service.handle(
              new Request(origin + url, { headers: { Origin: origin } }),
            )
          ).status,
        ).toBe(200)
        expect(
          (await service.handle(request(id, "POST", bytes, headers))).status,
        ).toBe(403)

        const deletion = new Request(origin + url, {
          method: "DELETE",
          headers: {
            Origin: origin,
            "X-Editor-Request": "1",
            "X-CSRF-Token": "fixture",
          },
        })

        expect((await service.handle(deletion)).status).toBe(403)
        cfg.policy = () => Promise.resolve(true)
        expect((await service.handle(deletion)).status).toBe(204)
        await service.cleanup({
          batchSize: 16,
          signal: new AbortController().signal,
        })
        const entered = barrier()
        const release = barrier()
        const finished = barrier()

        const delayed = {
          ...objects,
          async put(
            key: string,
            payload: Uint8Array,
            digest: string,
            signal: AbortSignal,
          ) {
            entered.resolve()
            await release.promise

            try {
              await objects.put(
                key,
                payload,
                digest,
                new AbortController().signal,
              )
              signal.throwIfAborted()
            } finally {
              finished.resolve()
            }
          },
        }

        const late = createAssetHttpHandler({ ...cfg, objects: delayed })
        const controller = new AbortController()

        const pending = late.handle(
          new Request(request(id, "POST", bytes, headers), {
            signal: controller.signal,
          }),
        )

        await entered.promise
        controller.abort()
        expect((await pending).status).toBe(503)
        await sql(
          `UPDATE editor_documents SET deleted=1,state_json=NULL,revision=revision+1 WHERE document_id='tenant:${id}'`,
        )
        await late.cleanup({
          batchSize: 16,
          signal: new AbortController().signal,
        })
        release.resolve()
        await finished.promise

        const inventory = await late.reconcile({
          limit: 100,
          signal: new AbortController().signal,
        })

        expect(inventory.unknown).toBe(0)
        expect(inventory.terminal).toBe(1)
        await new Promise((resolve) => setTimeout(resolve, 20))
        await late.cleanup({
          batchSize: 16,
          signal: new AbortController().signal,
        })
        expect(
          (await bucket.list({ prefix: "editor-attempts/" })).objects,
        ).toHaveLength(0)
        expect(
          await sql("SELECT status FROM editor_assets ORDER BY created_at"),
        ).toEqual([{ status: "terminal" }, { status: "terminal" }])
      }
    }, 30000)

    test("media scanners cannot dispatch PUT after verified expiry or a blocked deadline", async function scannerLifetime() {
      for (const reason of ["expiry", "deadline"] as const) {
        await reset()
        await document(`scanner-${reason}`)
        const cfg = config(repository, objects)
        cfg.maxFileBytes = 8192
        cfg.maxTotalBytes = 131072
        cfg.timeoutMs = reason === "deadline" ? 1000 : 5000
        let expires = Date.now() + 60000
        let puts = 0
        cfg.authenticate = () => {
          expires = Date.now() + (reason === "expiry" ? 2000 : 60000)

          return Promise.resolve({
            status: "authenticated",
            identity: { provider: "openauth", userId: "scanner" },
            credentialExpiresAt: expires,
          })
        }

        const admission = mediaPolicies()[0]

        if (!admission) throw new Error("admission")
        cfg.admissions = [
          {
            ...admission,
            validate() {
              const until =
                reason === "expiry" ? expires + 5 : Date.now() + 1005

              while (Date.now() < until) {
                Math.sqrt(Date.now())
              }

              return Promise.resolve(true)
            },
          },
        ]
        cfg.objects = {
          ...objects,
          async put(...args) {
            puts++
            await objects.put(...args)
          },
        }

        const response = await createAssetHttpHandler(cfg).handle(
          request(`scanner-${reason}`, "POST", mediaAudio, {
            "Content-Type": "audio/wav",
          }),
        )

        expect(response.status).toBe(reason === "expiry" ? 401 : 503)
        expect(puts).toBe(0)
        expect(await sql("SELECT status FROM editor_assets")).toEqual([
          { status: "terminal" },
        ])
      }
    }, 30000)

    test("media streams bound zero-byte fragments, declared length and read failures", async function mediaStreams() {
      await reset()
      await document("media-streams")
      const cfg = config(repository, objects)
      cfg.maxFileBytes = 8192
      cfg.maxTotalBytes = 131072
      cfg.timeoutMs = 2000
      cfg.admissions = mediaPolicies()
      let puts = 0
      cfg.objects = {
        ...objects,
        async put(...args) {
          puts++
          await objects.put(...args)
        },
      }
      const service = createAssetHttpHandler(cfg)

      function streamed(body: ReadableStream<Uint8Array>, length?: string) {
        const headers = new Headers(request("media-streams").headers)
        headers.set("Content-Type", "audio/wav")

        if (length !== undefined) headers.set("Content-Length", length)

        return new Request(request("media-streams").url, {
          method: "POST",
          headers,
          body,
        })
      }

      const fragmented = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const byte of mediaAudio) {
            controller.enqueue(new Uint8Array(0))
            controller.enqueue(new Uint8Array([byte]))
          }

          controller.close()
        },
      })

      const uploaded = await service.handle(streamed(fragmented))
      expect(uploaded.status).toBe(201)
      const { url } = z.object({ url: z.string() }).parse(await uploaded.json())
      expect(
        (
          await service.handle(
            new Request(origin + url, {
              method: "DELETE",
              headers: request("media-streams").headers,
            }),
          )
        ).status,
      ).toBe(204)
      let cancelled = false

      const endless = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(new Uint8Array(0))
        },
        cancel() {
          cancelled = true
        },
      })

      expect((await service.handle(streamed(endless))).status).toBe(503)
      expect(cancelled).toBe(true)
      expect(puts).toBe(1)

      for (const [stream, length, status] of [
        [
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(mediaAudio.subarray(0, 10))
              controller.close()
            },
          }),
          String(mediaAudio.length),
          400,
        ],
        [
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array(8193))
              controller.close()
            },
          }),
          undefined,
          413,
        ],
        [
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.error(new Error("truncated transport"))
            },
          }),
          undefined,
          503,
        ],
      ] as const)
        expect((await service.handle(streamed(stream, length))).status).toBe(
          status,
        )
      expect(puts).toBe(1)
      expect(await sql("SELECT DISTINCT status FROM editor_assets")).toEqual([
        { status: "terminal" },
      ])
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
    }, 30000)

    test("opaque downloads use portable safe filenames", async function filenames() {
      await reset()
      await document("filenames")
      const cfg = config(repository, objects)
      cfg.admissions = mediaPolicies().filter((entry) => entry.kind === "file")
      const service = createAssetHttpHandler(cfg)

      for (const [name, expected] of [
        ["../CON:bad?*|<>;.html", "CONbad.html"],
        ["CON.html", "download-CON.html"],
        [". ", "download"],
      ] as const) {
        const response = await service.handle(
          request("filenames", "POST", mediaFile, {
            "Content-Type": "text/html",
            "X-File-Name": name,
          }),
        )

        expect(response.status).toBe(201)

        const { url } = z
          .object({ url: z.string() })
          .parse(await response.json())

        const read = await service.handle(
          new Request(origin + url, { headers: { Origin: origin } }),
        )

        expect(read.status).toBe(200)
        expect(read.headers.get("Content-Disposition")).toStartWith(
          `attachment; filename="${expected}";`,
        )
        expect(Buffer.from(await read.arrayBuffer())).toEqual(mediaFile)
        expect(
          (
            await service.handle(
              new Request(origin + url, {
                method: "DELETE",
                headers: request("filenames").headers,
              }),
            )
          ).status,
        ).toBe(204)
      }

      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
    }, 30000)

    test("general delivery rejects provider size and full-body integrity faults", async function deliveryFaults() {
      await reset()
      await document("delivery-faults")
      const cfg = config(repository, objects)
      cfg.maxFileBytes = 8192
      cfg.maxTotalBytes = 131072
      cfg.admissions = mediaPolicies()
      const service = createAssetHttpHandler(cfg)

      for (const [type, bytes] of [
        ["audio/wav", mediaAudio],
        ["video/webm", mediaVideo],
        ["text/html", mediaFile],
      ] as const) {
        const uploaded = await service.handle(
          request("delivery-faults", "POST", bytes, { "Content-Type": type }),
        )

        expect(uploaded.status).toBe(201)

        const { url, assetId } = z
          .object({ url: z.string(), assetId: z.uuid() })
          .parse(await uploaded.json())

        const row = await repository.read("tenant:delivery-faults", assetId)

        if (!row) throw new Error("asset-row")
        const get = new Request(origin + url, { headers: { Origin: origin } })

        for (const payload of [
          bytes.subarray(0, bytes.length - 1),
          Buffer.concat([bytes, Buffer.from([0])]),
        ]) {
          await bucket.put(row.object_key, payload)
          expect((await service.handle(get)).status).toBe(503)
          expect(
            (
              await service.handle(
                new Request(get, {
                  headers: { Origin: origin, Range: "bytes=0-7" },
                }),
              )
            ).status,
          ).toBe(503)
        }

        const changed = Buffer.from(bytes)
        changed[changed.length - 1] = (changed[changed.length - 1] ?? 0) ^ 1
        await bucket.put(row.object_key, changed)
        expect((await service.handle(get)).status).toBe(503)
        expect(
          (
            await service.handle(
              new Request(get, {
                headers: { Origin: origin, Range: "bytes=0-" },
              }),
            )
          ).status,
        ).toBe(503)
        expect(
          (
            await service.handle(
              new Request(get, {
                method: "DELETE",
                headers: request("delivery-faults").headers,
              }),
            )
          ).status,
        ).toBe(204)
      }

      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
    }, 30000)

    test("authorized upload, safe read ranges and disposition; every GET rechecks policy", async function workflow() {
      await reset()
      await document("flow")
      const cfg = config(repository, objects)
      const service = createAssetHttpHandler(cfg)

      const result = await service.handle(
        request("flow", "POST", png, { "X-File-Name": "../evil.png" }),
      )

      expect(result.status).toBe(201)

      const asset = z
        .object({ assetId: z.uuid(), url: z.string() })
        .parse(await result.json())

      expect(asset.url).not.toContain("editor-attempts")

      const get = new Request(`https://host.example${asset.url}`, {
        headers: { Origin: origin, Range: "bytes=1-3" },
      })

      const partial = await service.handle(get)
      expect(
        partial.status,
        partial.status === 206 ? "range" : await partial.clone().text(),
      ).toBe(206)
      expect(partial.headers.get("Content-Range")).toBe(
        `bytes 1-3/${png.length}`,
      )
      expect(new Uint8Array(await partial.arrayBuffer())).toEqual(
        png.slice(1, 4),
      )
      expect(partial.headers.get("X-Content-Type-Options")).toBe("nosniff")
      expect(partial.headers.get("Cache-Control")).toBe("private, no-store")
      expect(partial.headers.get("Content-Disposition")).not.toContain("../")

      for (const range of [
        "bytes=0-1,3-4",
        "bytes=999-",
        "bytes=-0",
        "bytes=1e2-",
      ])
        expect(
          (
            await service.handle(
              new Request(get, { headers: { Origin: origin, Range: range } }),
            )
          ).status,
        ).toBe(416)

      for (const range of ["bytes=-3", "bytes=2-"])
        expect(
          (
            await service.handle(
              new Request(get, { headers: { Origin: origin, Range: range } }),
            )
          ).status,
        ).toBe(206)
      cfg.policy = function deny() {
        return Promise.resolve(false)
      }

      expect((await service.handle(get)).status).toBe(403)
      cfg.policy = function outage() {
        return Promise.resolve<"unavailable">("unavailable")
      }

      expect((await service.handle(get)).status).toBe(503)
      cfg.policy = function permit() {
        return Promise.resolve(true)
      }

      const deletion = new Request(get, {
        method: "DELETE",
        headers: {
          Origin: origin,
          "X-Editor-Request": "1",
          "X-CSRF-Token": "fixture",
        },
      })

      expect((await service.handle(deletion)).status).toBe(204)
      expect((await service.handle(deletion)).status).toBe(204)
      expect((await service.handle(get)).status).toBe(404)
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
    }, 30000)
    test("deny malformed paths/origins/CSRF/auth expiry/type/size and validator before PUT", async function security() {
      await reset()
      await document("security")
      const cfg = config(repository, objects)
      const service = createAssetHttpHandler(cfg)
      expect(
        (
          await service.handle(
            request("security", "POST", png, {
              Origin: "https://host.example.evil",
            }),
          )
        ).status,
      ).toBe(403)
      expect(
        (
          await service.handle(
            request("security", "POST", png, { "X-CSRF-Token": "wrong" }),
          )
        ).status,
      ).toBe(403)
      expect(
        (
          await service.handle(
            request("security", "POST", png, {
              "Content-Type": "image/svg+xml",
            }),
          )
        ).status,
      ).toBe(415)
      expect(
        (
          await service.handle(
            request("security", "POST", new Uint8Array(1025)),
          )
        ).status,
      ).toBe(413)
      expect(
        (await service.handle(request("security", "POST", new Uint8Array(12))))
          .status,
      ).toBe(415)
      expect(
        (await service.handle(request("security%252fsecret"))).status,
      ).toBe(400)
      cfg.authenticate = function expired() {
        return Promise.resolve<AuthenticationResult>({
          status: "authenticated",
          identity: { provider: "openauth", userId: "user" },
          credentialExpiresAt: Date.now(),
        })
      }

      expect((await service.handle(request("security"))).status).toBe(401)
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
    }, 30000)
    test("durable quota across two instances, cancelled body, terminal retention and concurrency", async function quotas() {
      await reset()
      await document("quota")

      const cfg = {
        ...config(repository, objects),
        maxAttempts: 2,
        maxPending: 1,
        maxTotalBytes: 2048,
      }

      const gate = barrier()
      const entered = barrier()
      cfg.validateImage = async function wait() {
        entered.resolve()
        await gate.promise

        return true
      }

      const a = createAssetHttpHandler(cfg),
        b = createAssetHttpHandler(cfg)

      const first = a.handle(request("quota"))
      await entered.promise
      expect((await b.handle(request("quota"))).status).toBe(429)
      gate.resolve()
      expect((await first).status).toBe(201)
      cfg.validateImage = function reject() {
        return Promise.resolve(false)
      }

      expect((await b.handle(request("quota"))).status).toBe(415)
      expect((await a.handle(request("quota"))).status).toBe(429)
      await sql("UPDATE editor_assets SET status='terminal',next_probe_at=0")
      await a.cleanup({ batchSize: 16, signal: new AbortController().signal })
      expect(await sql("SELECT COUNT(*) AS count FROM editor_assets")).toEqual([
        { count: 2 },
      ])
    }, 30000)
    test("late committed PUT after logical document deletion and DELETE is re-deleted by retained cleanup", async function latePut() {
      await reset()
      await document("late")

      const gate = barrier(),
        entered = barrier()

      const delayed: PrivateObjects = {
        ...objects,
        async put(key, bytes, digest, signal) {
          entered.resolve()
          await gate.promise
          await objects.put(key, bytes, digest, new AbortController().signal)
          signal.throwIfAborted()
        },
      }

      const cfg = config(repository, delayed)
      const service = createAssetHttpHandler(cfg)
      const upload = service.handle(request("late"))
      await entered.promise
      await sql(
        "UPDATE editor_documents SET deleted=1,state_json=NULL,revision=revision+1 WHERE document_id='tenant:late'",
      )
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
      gate.resolve()
      expect((await upload).status).not.toBe(201)
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(1)
      await new Promise((resolve) => setTimeout(resolve, 20))
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
      expect(await sql("SELECT status FROM editor_assets")).toEqual([
        { status: "terminal" },
      ])
      await sql(
        `UPDATE editor_documents SET deleted=0,state_json='{}',generation='${"c".repeat(64)}' WHERE document_id='tenant:late'`,
      )
      expect(await sql("SELECT status FROM editor_assets")).toEqual([
        { status: "terminal" },
      ])
    }, 30000)
    test("lost PUT response, promotion policy revocation, cleanup claim fencing and inventory", async function faults() {
      await reset()
      await document("fault")

      const lost: PrivateObjects = {
        ...objects,
        async put(...args) {
          await objects.put(...args)
          throw new Error("transport lost")
        },
      }

      const service = createAssetHttpHandler(config(repository, lost))
      expect((await service.handle(request("fault"))).status).toBe(503)
      expect(await sql("SELECT status FROM editor_assets")).toEqual([
        { status: "terminal" },
      ])
      const claims = await repository.claim(Date.now() + 10000, 1, 10)
      expect(claims).toHaveLength(1)
      const next = await repository.claim(Date.now() + 20000, 1, 10)

      const old = claims[0],
        current = next[0]

      if (!old || !current) throw new Error("missing claims")
      expect(
        await repository.ack(
          old.attempt_id,
          old.claim_token,
          Date.now() + 30000,
        ),
      ).toBe(false)
      expect(
        await repository.ack(current.attempt_id, current.claim_token, 0),
      ).toBe(true)
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      let count = 0
      const cfg = config(repository, objects)
      cfg.policy = function revoke() {
        return Promise.resolve(++count < 2)
      }

      expect(
        (await createAssetHttpHandler(cfg).handle(request("fault"))).status,
      ).toBe(403)
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })

      const report = await service.reconcile({
        limit: 100,
        signal: new AbortController().signal,
      })

      expect(report.unknown).toBe(0)
      expect(
        (await bucket.list({ prefix: "editor-attempts/" })).objects,
      ).toHaveLength(0)
    }, 30000)
    test("cancellation after durable reservation, expired policy and retained local concurrency slots", async function cancellation() {
      await reset()
      await document("cancel")

      const entered = barrier(),
        terminal = barrier(),
        controller = new AbortController()

      let puts = 0

      const boundedRepository = {
        ...repository,
        async reserve(...args: Parameters<typeof repository.reserve>) {
          const result = await repository.reserve(...args)
          entered.resolve()

          return result
        },
        async terminal(...args: Parameters<typeof repository.terminal>) {
          await repository.terminal(...args)
          terminal.resolve()
        },
      }

      const cfg = config(boundedRepository, {
        ...objects,
        async put(...args) {
          puts++
          await objects.put(...args)
        },
      })

      const body = new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(png)
        },
      })

      const req = new Request(request("cancel"), {
        method: "POST",
        body,
        signal: controller.signal,
      })

      const running = createAssetHttpHandler(cfg).handle(req)
      await entered.promise
      controller.abort()
      expect((await running).status).toBe(503)
      await terminal.promise
      expect(puts).toBe(0)
      expect(await sql("SELECT status FROM editor_assets")).toEqual([
        { status: "terminal" },
      ])
      await reset()
      const gate = barrier()

      const blocked = {
        ...config(repository, objects),
        maxConcurrent: 1,
        timeoutMs: 30,
        policy: function wait() {
          return gate.promise.then(() => true)
        },
      }

      const handler = createAssetHttpHandler(blocked)
      expect((await handler.handle(request("cancel"))).status).toBe(503)
      expect((await handler.handle(request("cancel"))).status).toBe(429)
      gate.resolve()
      await new Promise((resolve) => setTimeout(resolve, 20))
      const expiry = config(repository, objects)
      expiry.authenticate = function authenticate() {
        return Promise.resolve<AuthenticationResult>({
          status: "authenticated",
          identity: { provider: "openauth", userId: "user" },
          credentialExpiresAt: Date.now() + 30,
        })
      }

      expiry.policy = function wait() {
        return new Promise((resolve) => setTimeout(() => resolve(true), 60))
      }

      expect(
        (await createAssetHttpHandler(expiry).handle(request("cancel"))).status,
      ).toBe(503)
      expect(await sql("SELECT COUNT(*) AS count FROM editor_assets")).toEqual([
        { count: 0 },
      ])
    }, 30000)
    test("maximum file byte budget and aggregate buffer configuration", async function byteBudget() {
      await reset()
      await document("bytes")
      expect(() =>
        createAssetHttpHandler({
          ...config(repository, objects),
          maxFileBytes: 10485760,
          maxTotalBytes: 10485760,
          maxConcurrent: 64,
        }),
      ).toThrow()
      const bytes = new Uint8Array(10485760)
      bytes.set(png)

      const cfg = {
        ...config(repository, objects),
        maxFileBytes: bytes.length,
        maxTotalBytes: bytes.length,
        maxConcurrent: 1,
        timeoutMs: 30000,
        validateImage: function validate() {
          return Promise.resolve(true)
        },
      }

      const service = createAssetHttpHandler(cfg)
      const response = await service.handle(request("bytes", "POST", bytes))
      expect(response.status).toBe(201)
      const asset = z.object({ url: z.string() }).parse(await response.json())

      const get = new Request(`https://host.example${asset.url}`, {
        headers: { Origin: origin },
      })

      const read = await service.handle(get)
      expect(read.status).toBe(200)
      expect(await assetDigest(new Uint8Array(await read.arrayBuffer()))).toBe(
        await assetDigest(bytes),
      )
      expect(
        (
          await service.handle(
            new Request(get, {
              method: "DELETE",
              headers: {
                Origin: origin,
                "X-Editor-Request": "1",
                "X-CSRF-Token": "fixture",
              },
            }),
          )
        ).status,
      ).toBe(204)
      await service.cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
    }, 60000)
    test("database clock rejects promotion with stale caller time", async function databaseExpiry() {
      await reset()
      await document("database-expiry")
      const now = Date.now()

      const row = await repository.reserve({
        documentId: "tenant:database-expiry",
        generation,
        assetId: crypto.randomUUID(),
        attemptId: "1".repeat(64),
        mediaType: "image/png",
        name: "test",
        now,
        leaseUntil: now - 1,
        bytes: 1024,
        maxBytes: 8192,
        maxAttempts: 16,
        maxPending: 4,
      })

      if (!row) throw new Error("reservation")
      expect(
        await repository.promote(
          row,
          png.length,
          await assetDigest(png),
          now - 10000,
        ),
      ).toBeNull()
      expect(
        await repository.remove(
          "tenant:database-expiry",
          row.asset_id,
          Date.now() - 1,
        ),
      ).toBe(false)
    }, 30000)
    test("SQL reservation fault has no PUT; committed promotion response loss hides asset; inventory preserves unknown data", async function sqlFaults() {
      await reset()
      await document("sqlfault")

      if (dialect === "d1")
        await sql(
          "CREATE TRIGGER asset_fault BEFORE INSERT ON editor_assets BEGIN SELECT RAISE(ABORT,'fixture'); END",
        )
      else {
        await pg.exec(
          "CREATE FUNCTION asset_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture'; END $$; CREATE TRIGGER asset_fault BEFORE INSERT ON editor_assets FOR EACH ROW EXECUTE FUNCTION asset_fault()",
        )
      }

      const service = createAssetHttpHandler(config(repository, objects))
      expect((await service.handle(request("sqlfault"))).status).toBe(503)
      expect(await sql("SELECT COUNT(*) AS count FROM editor_assets")).toEqual([
        { count: 0 },
      ])

      if (dialect === "d1") await sql("DROP TRIGGER asset_fault")
      else
        await pg.exec(
          "DROP TRIGGER asset_fault ON editor_assets; DROP FUNCTION asset_fault()",
        )

      const lost = {
        ...repository,
        async promote(...args: Parameters<typeof repository.promote>) {
          await repository.promote(...args)
          throw new Error("lost result")
        },
      }

      expect(
        (
          await createAssetHttpHandler(config(lost, objects)).handle(
            request("sqlfault"),
          )
        ).status,
      ).toBe(503)
      expect(await sql("SELECT status FROM editor_assets")).toEqual([
        { status: "terminal" },
      ])
      let deletes = 0

      const lostAck = {
        ...repository,
        async ack(...args: Parameters<typeof repository.ack>) {
          await repository.ack(...args)
          throw new Error("lost cleanup acknowledgment")
        },
      }

      const counted = {
        ...objects,
        async delete(...args: Parameters<typeof objects.delete>) {
          deletes++
          await objects.delete(...args)
        },
      }

      const failedCleanup = createAssetHttpHandler(config(lostAck, counted))
      expect(
        await failedCleanup
          .cleanup({ batchSize: 16, signal: new AbortController().signal })
          .then(
            () => false,
            () => true,
          ),
      ).toBe(true)
      await new Promise((resolve) => setTimeout(resolve, 20))
      await createAssetHttpHandler(config(repository, counted)).cleanup({
        batchSize: 16,
        signal: new AbortController().signal,
      })
      expect(deletes).toBe(2)
      const key = `editor-attempts/${"f".repeat(64)}`
      await bucket.put(key, png)
      expect(
        (
          await service.reconcile({
            limit: 100,
            signal: new AbortController().signal,
          })
        ).unknown,
      ).toBe(1)
      expect(await bucket.head(key)).not.toBeNull()
      await bucket.delete(key)
    }, 30000)
  })
}

describe("S3 signed loopback protocol", function s3Suite() {
  test("signed conditional PUT/GET/range/DELETE/list; no credentials in URL; no redirects or retries", async function protocol() {
    const data = new Map<string, Uint8Array>()
    const methods: string[] = []

    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      async fetch(req) {
        const u = new URL(req.url)
        expect(u.searchParams.has("X-Amz-Credential")).toBe(false)
        expect(req.headers.get("Authorization")).toStartWith(
          "AWS4-HMAC-SHA256 ",
        )

        const signedHeaders =
          /SignedHeaders=([^,]+)/
            .exec(req.headers.get("Authorization") ?? "")?.[1]
            ?.split(";") ?? []

        const headers = new Headers()

        for (const name of signedHeaders) {
          const value = req.headers.get(name)

          if (value !== null) headers.set(name, value)
        }

        const verification = new AwsV4Signer({
          method: req.method,
          url: req.url,
          headers,
          accessKeyId: "fixture",
          secretAccessKey: "fixture-secret",
          service: "s3",
          region: "test",
          datetime: req.headers.get("x-amz-date") ?? "",
        })

        expect((await verification.sign()).headers.get("Authorization")).toBe(
          req.headers.get("Authorization"),
        )
        methods.push(req.method)

        if (u.searchParams.has("list-type"))
          return new Response(
            `<ListBucketResult><IsTruncated>false</IsTruncated>${[...data.keys()].map((k) => `<Contents><Key>${k.slice("/bucket/".length)}</Key><LastModified>2026-01-01T00:00:00.000Z</LastModified></Contents>`).join("")}</ListBucketResult>`,
          )

        if (u.pathname.endsWith("e".repeat(64)))
          return new Response(null, {
            status: 307,
            headers: { Location: "http://127.0.0.1:1/" },
          })

        if (req.method === "PUT") {
          expect(req.headers.get("If-None-Match")).toBe("*")

          if (data.has(u.pathname)) return new Response(null, { status: 412 })
          const bytes = new Uint8Array(await req.arrayBuffer())
          expect(await assetDigest(bytes)).toBe(
            req.headers.get("x-amz-content-sha256") ?? "",
          )
          data.set(u.pathname, bytes)

          return new Response(null, { headers: { ETag: '"fixture"' } })
        }

        if (req.method === "DELETE") {
          data.delete(u.pathname)

          return new Response(null, { status: 204 })
        }

        const bytes = data.get(u.pathname)

        if (!bytes) return new Response(null, { status: 404 })
        const range = req.headers.get("Range")

        if (range) {
          const m = /bytes=(\d+)-(\d+)/.exec(range)

          if (!m?.[1] || !m[2]) throw new Error("range")

          const start = Number(m[1]),
            end = Number(m[2])

          return new Response(bytes.slice(start, end + 1), {
            status: 206,
            headers: {
              "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
              "Content-Length": String(end - start + 1),
            },
          })
        }

        return new Response(new Uint8Array(bytes).buffer, {
          headers: { "Content-Length": String(bytes.length) },
        })
      },
    })

    try {
      const objects = createS3Objects({
        endpoint: server.url.origin,
        bucket: "bucket",
        region: "test",
        accessKeyId: "fixture",
        secretAccessKey: "fixture-secret",
        versioning: "disabled",
        allowLoopback: true,
      })

      const signal = new AbortController().signal
      const key = `editor-attempts/${"d".repeat(64)}`
      const digest = await assetDigest(png)
      await objects.put(key, png, digest, signal)
      expect(
        await objects
          .get(key, { start: 1, end: 3 }, signal)
          .then(async (r) => r && (await readAssetBytes(r.body, 1024, signal))),
      ).toEqual(png.slice(1, 4))
      expect((await objects.list(undefined, 10, signal)).keys).toHaveLength(1)
      expect(
        await objects.put(key, png, digest, signal).then(
          () => false,
          () => true,
        ),
      ).toBe(true)
      await objects.delete(key, signal)
      expect(await objects.get(key, null, signal)).toBeNull()
      expect(
        await objects
          .get(`editor-attempts/${"e".repeat(64)}`, null, signal)
          .then(
            () => false,
            () => true,
          ),
      ).toBe(true)
      expect(methods.filter((m) => m === "PUT")).toHaveLength(2)
      const engine = new PGlite()

      try {
        for (const name of [
          "0001-document-snapshots.sql",
          "0002-private-assets.sql",
          "0003-general-assets.sql",
        ])
          await engine.exec(
            await readFile(
              new URL(
                `../../packages/editor/src/server/migrations/postgres/${name}`,
                import.meta.url,
              ),
              "utf8",
            ),
          )
        await engine.exec(
          `INSERT INTO editor_documents VALUES('tenant:s3','${generation}',1,'snapshot','{}',1,0,'${"b".repeat(64)}')`,
        )

        let releases = 0

        const pool: DocumentPgPool = {
          connect() {
            return Promise.resolve({
              query(c) {
                return engine.query(c.text, c.values)
              },
              release() {
                releases++
              },
            })
          },
        }

        const repository = createPostgresAssetRepository(pool, {
          timeoutMs: 3000,
          maxConcurrent: 8,
        })

        const cfg = config(repository, objects)
        cfg.maxFileBytes = 8192
        cfg.maxTotalBytes = 131072
        cfg.admissions = mediaPolicies()
        const service = createAssetHttpHandler(cfg)

        const host = Bun.serve({
          hostname: "127.0.0.1",
          port: 0,
          fetch: service.handle,
        })

        try {
          const uploaded = await fetch(
            new URL("/editor/documents/tenant:s3/assets", host.url),
            {
              method: "POST",
              headers: request("s3").headers,
              body: new Uint8Array(png).buffer,
            },
          )

          expect(uploaded.status).toBe(201)

          const asset = z
            .object({ url: z.string() })
            .parse(await uploaded.json())

          const read = new Request(new URL(asset.url, host.url), {
            headers: { Origin: origin },
          })

          const response = await fetch(read)
          expect(response.status).toBe(200)
          expect(new Uint8Array(await response.arrayBuffer())).toEqual(png)
          expect(
            (
              await fetch(
                new Request(read, {
                  method: "DELETE",
                  headers: {
                    Origin: origin,
                    "X-Editor-Request": "1",
                    "X-CSRF-Token": "fixture",
                  },
                }),
              )
            ).status,
          ).toBe(204)

          for (const [type, bytes] of [
            ["audio/wav", mediaAudio],
            ["video/webm", mediaVideo],
            ["text/html", mediaFile],
          ] as const) {
            const headers = new Headers(request("s3").headers)
            headers.set("Content-Type", type)

            const uploadedMedia = await fetch(
              new URL("/editor/documents/tenant:s3/assets", host.url),
              { method: "POST", headers, body: bytes },
            )

            expect(uploadedMedia.status).toBe(201)

            const { url } = z
              .object({ url: z.string() })
              .parse(await uploadedMedia.json())

            const mediaUrl = new URL(url, host.url)

            const fullMedia = await fetch(mediaUrl, {
              headers: { Origin: origin },
            })

            expect(fullMedia.status).toBe(200)
            expect(Buffer.from(await fullMedia.arrayBuffer())).toEqual(bytes)

            const partialMedia = await fetch(mediaUrl, {
              headers: { Origin: origin, Range: "bytes=0-7" },
            })

            expect(partialMedia.status).toBe(206)
            expect(Buffer.from(await partialMedia.arrayBuffer())).toEqual(
              bytes.subarray(0, 8),
            )
            expect(
              (await fetch(mediaUrl, { method: "DELETE", headers })).status,
            ).toBe(204)
          }

          await service.cleanup({ batchSize: 16, signal })
          expect(data.size).toBe(0)
          expect(releases).toBeGreaterThan(0)
        } finally {
          await host.stop(true)
        }
      } finally {
        await engine.close()
      }
    } finally {
      await server.stop(true)
    }
  }, 30000)
})
