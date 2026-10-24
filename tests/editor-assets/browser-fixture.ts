import type { AssetConfig } from "@editor/server/asset-model"
import type { DocumentPgPool } from "@editor/server/document-postgres"

import { createAssetHttpHandler } from "@editor/server/asset-http"
import { createR2Objects } from "@editor/server/asset-r2"
import { createPostgresAssetRepository } from "@editor/server/asset-repository"
import { PGlite } from "@electric-sql/pglite"
import { Miniflare } from "miniflare"
import { readFile } from "node:fs/promises"

import { mediaPolicies } from "./media-policies"

export const browserPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
)

export async function createBrowserFixture(
  key: string,
  cert: string,
  general = false,
) {
  const pg = new PGlite()

  for (const name of [
    "0001-document-snapshots.sql",
    "0002-private-assets.sql",
    "0003-general-assets.sql",
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
  await pg.exec(
    `INSERT INTO editor_documents VALUES('tenant:browser','${"a".repeat(64)}',1,'snapshot','{"root":{"type":"root","children":[]}}',1,0,'${"b".repeat(64)}')`,
  )
  let previous = Promise.resolve()

  const pool: DocumentPgPool = {
    async connect() {
      const ready = previous
      const done = Promise.withResolvers<void>()
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

  const build = await Bun.build({
    entrypoints: [new URL("./r2-worker.ts", import.meta.url).pathname],
    target: "browser",
    minify: true,
  })

  if (!build.success || !build.outputs[0]) throw new Error("worker-build")

  const mf = new Miniflare({
    workers: [
      {
        config: {
          name: "browser-assets",
          compatibilityDate: "2026-09-01",
          manifest: {
            mainModule: "worker.js",
            modules: {
              "worker.js": {
                type: "esm",
                contents: await build.outputs[0].text(),
              },
            },
          },
          env: { BUCKET: { type: "r2", name: "browser-assets" } },
        },
      },
    ],
  })

  const objects = createR2Objects(await mf.getR2Bucket("BUCKET"), {
    versioning: "disabled",
  })

  const session = crypto.randomUUID()
  let expires = Date.now() + 600000
  let policy: "allow" | "document-deny" | "asset-deny" = "allow"
  let bearerOnly = false

  const records: {
    method: string
    path: string
    origin: string | null
    site: string | null
    mode: string | null
    dest: string | null
    user: string | null
    referer: string | null
    status: number
    range: string | null
  }[] = []

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    tls: { key, cert },
    async fetch(request) {
      const url = new URL(request.url)

      if (url.pathname === "/")
        return new Response(
          `<!doctype html><html lang="en"><meta charset="utf-8"><title>Private assets fixture</title><body><button id="login">Login fixture</button><input id="file" type="file" aria-label="PNG file"><button id="upload">Upload</button><button id="fetch">Fetch asset</button><img id="image" alt="Uploaded raster"><a id="download" download="pixel.png">Download</a><a id="navigate">Open asset</a><output id="result"></output><script>
let asset;
const result = document.getElementById('result');
document.getElementById('login').onclick = async function() { const r = await fetch('/login', {method:'POST',headers:{'X-Editor-Request':'1','X-CSRF-Token':'fixture'}}); result.textContent = 'login:'+r.status; };
document.getElementById('upload').onclick = async function() { const file = document.getElementById('file').files[0]; const r = await fetch('/editor/documents/tenant:browser/assets', {method:'POST',headers:{'Content-Type':'image/png','X-File-Name':'pixel.png','X-Editor-Request':'1','X-CSRF-Token':'fixture'},body:file}); if(r.ok) { asset = (await r.json()).url; document.getElementById('image').src=asset; document.getElementById('download').href=asset; document.getElementById('navigate').href=asset; } result.textContent='upload:'+r.status; };
document.getElementById('fetch').onclick = async function() { const r = await fetch(asset); result.textContent='fetch:'+r.status+':'+(await r.arrayBuffer()).byteLength; };
</script></body></html>`,
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          },
        )

      if (url.pathname === "/login") {
        if (
          request.method !== "POST" ||
          request.headers.get("Origin") !== server.url.origin ||
          request.headers.get("X-Editor-Request") !== "1" ||
          request.headers.get("X-CSRF-Token") !== "fixture"
        )
          return new Response(null, { status: 403 })

        return new Response(null, {
          status: 204,
          headers: {
            "Set-Cookie": `fixture=${session}; Secure; HttpOnly; SameSite=Strict; Path=/`,
          },
        })
      }

      if (url.pathname === "/favicon.ico")
        return new Response(null, { status: 204 })
      const response = await service.handle(request)
      records.push({
        method: request.method,
        path: url.pathname,
        origin: request.headers.get("Origin"),
        site: request.headers.get("Sec-Fetch-Site"),
        mode: request.headers.get("Sec-Fetch-Mode"),
        dest: request.headers.get("Sec-Fetch-Dest"),
        user: request.headers.get("Sec-Fetch-User"),
        referer: request.headers.get("Referer"),
        status: response.status,
        range: request.headers.get("Range"),
      })

      return response
    },
  })

  const config: AssetConfig = {
    repository: createPostgresAssetRepository(pool, {
      timeoutMs: 3000,
      maxConcurrent: 8,
    }),
    objects: {
      ...objects,
      async get(objectKey, range, signal) {
        const url = new URL(await mf.ready)
        url.searchParams.set("key", objectKey)
        const headers = new Headers()

        if (range) headers.set("Range", `bytes=${range.start}-${range.end}`)
        const response = await fetch(url, { headers, signal })

        if (response.status === 404) return null
        const bytes = new Uint8Array(await response.arrayBuffer())
        const body = new Response(bytes).body

        if (!body) throw new Error("fixture-body")

        return { body, size: Number(response.headers.get("X-Object-Size")) }
      },
    },
    allowedOrigins: [server.url.origin],
    maxConcurrent: 8,
    timeoutMs: 10000,
    maxFileBytes: general ? 8192 : 1024,
    admissions: general ? mediaPolicies() : undefined,
    maxTotalBytes: 65536,
    maxAttempts: 64,
    maxPending: 4,
    cleanupIntervalMs: 10,
    authenticate(request) {
      const authenticated = bearerOnly
        ? request.headers.get("Authorization") === `Bearer ${session}`
        : request.headers
            .get("Cookie")
            ?.split("; ")
            .includes(`fixture=${session}`)

      return Promise.resolve(
        authenticated
          ? {
              status: "authenticated",
              identity: { provider: "openauth", userId: "fixture-user" },
              credentialExpiresAt: expires,
            }
          : { status: "unauthenticated" },
      )
    },
    policy(input) {
      return Promise.resolve(
        policy === "allow" || (policy === "asset-deny" && !input.assetId),
      )
    },
    verifyCsrf(request) {
      return Promise.resolve(request.headers.get("X-CSRF-Token") === "fixture")
    },
    validateImage(bytes, type) {
      return Promise.resolve(
        type === "image/png" && Buffer.from(bytes).equals(browserPng),
      )
    },
  }

  const service = createAssetHttpHandler(config)

  return {
    origin: server.url.origin,
    records,
    config,
    setExpiry(value: number) {
      expires = value
    },
    setPolicy(value: typeof policy) {
      policy = value
    },
    setBearerOnly(value: boolean) {
      bearerOnly = value
    },
    async close() {
      await server.stop(true)
      await mf.dispose()
      await pg.close()
    },
  }
}
