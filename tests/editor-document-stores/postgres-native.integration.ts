import type {
  DocumentContext,
  DocumentMutation,
} from "@editor/server/document-model"
import type { DocumentPgPool } from "@editor/server/document-postgres"
import type { IncomingHttpHeaders } from "node:http"

import { createDocumentHttpHandler } from "@editor/server/document-http"
import { createPostgresDocumentService } from "@editor/server/document-postgres"
import { createOpenAuthAuthentication } from "@editor/server/openauth"
import { exportJWK, generateKeyPair, SignJWT } from "jose"
import assert from "node:assert/strict"
import { once } from "node:events"
import { readFileSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { createServer, request } from "node:https"
import { resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { Pool } from "pg"
import { z } from "zod"

const fixture = process.env.EDITOR_PG_FIXTURE

assert(
  fixture,
  "EDITOR_PG_FIXTURE must name prepared native PostgreSQL TLS fixture",
)

const artifact = process.env.EDITOR_PG_ARTIFACT

assert(artifact, "EDITOR_PG_ARTIFACT must name output JSON")

const ca = readFileSync(resolve(fixture, "cluster/server.crt"))

const schema = `native_${crypto.randomUUID().replaceAll("-", "")}`

const settings = {
  host: "127.0.0.1",
  port: Number(readFileSync(resolve(fixture, "port"), "utf8").trim()),
  user: "editor_fixture",
  database: "postgres",
  password: readFileSync(resolve(fixture, "password"), "utf8").trim(),
  ssl: { ca, rejectUnauthorized: true },
  connectionTimeoutMillis: 2000,
  max: 4,
}

const admin = new Pool(settings)

const pool = new Pool({
  ...settings,
  options: `-c search_path=${schema},pg_catalog`,
})

const checks: string[] = []

interface Evidence {
  runtime: NodeJS.ProcessVersions
  schema: string
  checks: string[]
  connections?: { pid: number; version: string; ssl: boolean; tls: string }[]
  deadlines: {
    phase: string
    dispatched: string[]
    later: string[]
    durable: boolean
  }[]
  status?: string
  failure?: { name: string; message: string; stack?: string } | string
  cleaned?: boolean
}

const evidence: Evidence = {
  runtime: process.versions,
  schema,
  checks,
  deadlines: [],
}

function context(userId = "owner", budget = 3000): DocumentContext {
  return {
    identity: { provider: "openauth", userId },
    signal: new AbortController().signal,
    deadline: Date.now() + budget,
  }
}

const config = {
  policy: function policy(input: { identity: { userId: string } }) {
    return Promise.resolve(input.identity.userId !== "denied")
  },
  validateState: function validateState() {
    return true
  },
  timeoutMs: 2000,
  maxConcurrent: 8,
}

function save(
  documentId: string,
  expected: DocumentMutation["expected"] = { kind: "absent" },
): DocumentMutation {
  return {
    documentId,
    expected,
    operationId: crypto.randomUUID(),
    change: {
      kind: "save",
      schemaVersion: 1,
      state: '{"root":{"type":"root","children":[]}}',
    },
  }
}

function block(ms: number) {
  const end = Date.now() + ms

  while (Date.now() < end) Math.sqrt(Date.now())
}

const service = createPostgresDocumentService(pool, config)

const other = createPostgresDocumentService(pool, config)

let httpServer: ReturnType<typeof createServer> | undefined

let issuerServer: ReturnType<typeof createHttpServer> | undefined

try {
  await admin.query(`CREATE SCHEMA ${schema}`)

  const migration = readFileSync(
    resolve(
      "packages/editor/src/server/migrations/postgres/0001-document-snapshots.sql",
    ),
    "utf8",
  )

  const migrationClient = await pool.connect()

  try {
    await migrationClient.query("BEGIN")
    await migrationClient.query(
      `SET LOCAL search_path TO ${schema}, pg_catalog`,
    )
    await migrationClient.query(migration)
    await migrationClient.query("COMMIT")
  } finally {
    migrationClient.release()
  }

  const clients = await Promise.all([pool.connect(), pool.connect()])

  try {
    const connections = await Promise.all(
      clients.map((client) =>
        client.query(
          "SELECT pg_backend_pid() pid, current_setting('server_version') version, ssl, version AS tls FROM pg_stat_ssl WHERE pid=pg_backend_pid()",
        ),
      ),
    )

    const first = connections[0]?.rows[0]
    const second = connections[1]?.rows[0]
    assert(first && second)
    assert.notEqual(first.pid, second.pid)
    assert.equal(first.ssl, true)
    assert.equal(second.ssl, true)
    evidence.connections = connections.map((result) => result.rows[0])
    checks.push("verified TLS and distinct native backend PIDs")
  } finally {
    clients.forEach((client) => client.release())
  }

  const race = await Promise.all([
    service.mutate(save("app:race"), context()),
    other.mutate(save("app:race"), context()),
  ])

  assert.equal(race.filter((result) => result.status === "committed").length, 1)
  assert.equal(race.filter((result) => result.status === "conflict").length, 1)
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM editor_operations WHERE document_id='app:race'",
      )
    ).rows[0].n,
    1,
  )
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int n FROM editor_generations WHERE document_id='app:race'",
      )
    ).rows[0].n,
    1,
  )
  checks.push("independent absent CAS exactly one durable winner and receipt")
  const retry = save("app:retry")

  const receipts = await Promise.all([
    service.mutate(retry, context()),
    other.mutate(retry, context()),
  ])

  assert.deepEqual(receipts[0], receipts[1])
  assert.equal((await service.read("app:retry", context()))?.revision, "1")
  await assert.rejects(
    service.mutate(
      {
        ...retry,
        change: {
          kind: "save",
          schemaVersion: 1,
          state: '{"root":{"type":"root","children":[],"changed":true}}',
        },
      },
      context(),
    ),
    { code: "operation-reuse" },
  )
  await assert.rejects(service.mutate(retry, context("different-actor")), {
    code: "operation-reuse",
  })
  checks.push("concurrent idempotent retries and payload/actor binding")
  const old = await service.read("app:retry", context())
  assert(old)
  assert.equal(old.revision, "1")

  const deleted = await service.mutate(
    {
      ...save("app:retry", { kind: "etag", etag: old.etag }),
      change: { kind: "delete" },
    },
    context(),
  )

  assert.equal(deleted.status, "committed")
  const recreated = await other.mutate(save("app:retry"), context())
  assert.equal(recreated.status, "committed")

  if (recreated.status !== "committed") throw new Error("recreation failed")
  assert.notEqual(recreated.record.generation, old.generation)
  assert.equal(
    (
      await service.mutate(
        save("app:retry", { kind: "etag", etag: old.etag }),
        context(),
      )
    ).status,
    "conflict",
  )

  const updates = await Promise.all([
    service.mutate(
      save("app:retry", { kind: "etag", etag: recreated.record.etag }),
      context(),
    ),
    other.mutate(
      save("app:retry", { kind: "etag", etag: recreated.record.etag }),
      context(),
    ),
  ])

  assert.equal(
    updates.filter((result) => result.status === "committed").length,
    1,
  )
  checks.push(
    "tombstone recreation new generation prevents ABA and ETag race has one winner",
  )
  await pool.query(
    "UPDATE editor_documents SET revision=9223372036854775806 WHERE document_id='app:retry'",
  )
  const large = await service.read("app:retry", context())
  assert(large)
  assert.equal(large.revision, "9223372036854775806")

  const maximum = await service.mutate(
    save("app:retry", { kind: "etag", etag: large.etag }),
    context(),
  )

  assert.equal(maximum.status, "committed")

  if (maximum.status !== "committed") throw new Error("maximum failed")
  assert.equal(maximum.record.revision, "9223372036854775807")
  await assert.rejects(
    service.mutate(
      save("app:retry", { kind: "etag", etag: maximum.record.etag }),
      context(),
    ),
    { code: "exhausted" },
  )
  checks.push("signed64 string precision and overflow rejection")

  const keys = await generateKeyPair("ES256", { extractable: true })

  const jwk = {
    ...(await exportJWK(keys.publicKey)),
    kid: "fixture",
    alg: "ES256",
  }

  issuerServer = createHttpServer((_incoming, outgoing) => {
    outgoing.setHeader("content-type", "application/json")
    outgoing.end(JSON.stringify({ keys: [jwk] }))
  })
  issuerServer.listen(0, "127.0.0.1")
  await once(issuerServer, "listening")

  const issuerAddress = z
    .object({ port: z.number().int().positive() })
    .parse(issuerServer.address())

  const issuer = `http://127.0.0.1:${issuerAddress.port}`

  const authenticate = createOpenAuthAuthentication({
    issuer,
    audience: "native-fixture",
    allowInsecureLocalhost: true,
  })

  function token(userId: string, expired = false) {
    return new SignJWT({
      mode: "access",
      type: "user",
      properties: {
        id: userId,
        email: "fixture@localhost",
        name: null,
        username: "fixture",
        image: null,
      },
    })
      .setProtectedHeader({ alg: "ES256", kid: "fixture" })
      .setIssuer(issuer)
      .setAudience("native-fixture")
      .setExpirationTime(Math.floor(Date.now() / 1000) + (expired ? -60 : 60))
      .sign(keys.privateKey)
  }

  interface Handlers {
    current?: ReturnType<typeof createDocumentHttpHandler>
  }

  const handlers: Handlers = {}

  httpServer = createServer(
    { cert: ca, key: readFileSync(resolve(fixture, "cluster/server.key")) },
    (incoming, outgoing) => {
      void respond()

      async function respond() {
        try {
          const chunks: Buffer[] = []

          for await (const chunk of incoming) chunks.push(Buffer.from(chunk))
          const headers = new Headers()

          for (const [name, value] of Object.entries(incoming.headers))
            if (value !== undefined)
              headers.set(name, Array.isArray(value) ? value.join(",") : value)
          assert(handlers.current)

          const response = await handlers.current(
            new Request(`${origin}${incoming.url}`, {
              method: incoming.method,
              headers,
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            }),
          )

          outgoing.writeHead(
            response.status,
            Object.fromEntries(response.headers),
          )
          outgoing.end(Buffer.from(await response.arrayBuffer()))
        } catch {
          outgoing.writeHead(500)
          outgoing.end()
        }
      }
    },
  )
  httpServer.listen(0, "127.0.0.1")
  await once(httpServer, "listening")

  const address = z
    .object({ port: z.number().int().positive() })
    .parse(httpServer.address())

  const origin = `https://127.0.0.1:${address.port}`
  handlers.current = createDocumentHttpHandler({
    origin,
    basePath: "/documents/",
    authenticate,
    policy: function policy(input) {
      return input.identity.userId !== "denied"
    },
    verifyCsrf: function verifyCsrf(input) {
      return input.token === "fixture-csrf"
    },
    service,
    timeoutMs: 2000,
    maxConcurrent: 8,
  })
  const ownerToken = await token("owner")

  function http(
    method: string,
    overrides: Record<string, string> = {},
    body?: string,
  ) {
    return new Promise<{
      status: number
      headers: IncomingHttpHeaders
      body: string
    }>((accept, reject) => {
      const req = request(
        `${origin}/documents/app:http`,
        {
          method,
          ca,
          rejectUnauthorized: true,
          headers: {
            origin,
            authorization: `Bearer ${ownerToken}`,
            "x-csrf-token": "fixture-csrf",
            "content-type": "application/json",
            ...overrides,
          },
        },
        (response) => {
          const chunks: Buffer[] = []
          response.on("data", (chunk: Buffer) => chunks.push(chunk))
          response.on("end", () =>
            accept({
              status: response.statusCode ?? 0,
              headers: response.headers,
              body: Buffer.concat(chunks).toString(),
            }),
          )
        },
      )

      req.on("error", reject)
      req.end(body)
    })
  }

  const payload =
    '{"schemaVersion":1,"state":{"root":{"type":"root","children":[]}}}'

  const written = await http(
    "PUT",
    { "if-none-match": "*", "idempotency-key": crypto.randomUUID() },
    payload,
  )

  assert.equal(written.status, 200)
  const etag = written.headers.etag
  assert(etag)
  assert.equal((await http("GET")).status, 200)

  for (const [headers, status] of [
    [{ authorization: "Bearer invalid" }, 401],
    [{ authorization: `Bearer ${await token("owner", true)}` }, 401],
    [{ authorization: `Bearer ${await token("denied")}` }, 403],
    [{ origin: "https://wrong.example" }, 403],
    [{ "x-csrf-token": "wrong" }, 403],
  ] as const) {
    assert.equal(
      (
        await http(
          "PUT",
          {
            "if-match": String(etag),
            "idempotency-key": crypto.randomUUID(),
            ...headers,
          },
          payload,
        )
      ).status,
      status,
    )
    assert.equal((await http("GET")).headers.etag, etag)
  }

  assert.equal(
    (
      await http(
        "PUT",
        { "if-none-match": "*", "idempotency-key": crypto.randomUUID() },
        payload,
      )
    ).status,
    412,
  )

  assert.equal(
    (
      await http(
        "PUT",
        { "if-match": String(etag), "idempotency-key": crypto.randomUUID() },
        "{",
      )
    ).status,
    400,
  )
  assert.equal((await http("GET")).headers.etag, etag)

  const updated = await http(
    "PUT",
    { "if-match": String(etag), "idempotency-key": crypto.randomUUID() },
    payload,
  )

  assert.equal(updated.status, 200)
  assert.equal(
    (
      await http("DELETE", {
        "if-match": String(updated.headers.etag),
        "idempotency-key": crypto.randomUUID(),
      })
    ).status,
    200,
  )
  assert.equal((await service.read("app:http", context()))?.deleted, true)
  checks.push(
    "real verified HTTPS GET PUT DELETE with local signed JWT/JWKS policy Origin CSRF expiry and durable denial checks",
  )

  for (const phase of [
    "BEGIN",
    "SELECT set_config",
    "SELECT pg_advisory",
    "INSERT INTO editor_operations",
    "COMMIT",
  ]) {
    const dispatched: string[] = []
    let blocked = false
    let commits = 0
    let blockedIndex = -1

    const observing: DocumentPgPool = {
      async connect() {
        const client = await pool.connect()

        return {
          async query(query) {
            dispatched.push(query.text)
            const result = await client.query(query)

            if (query.text === "COMMIT") commits++

            if (
              !blocked &&
              query.text.startsWith(phase) &&
              (phase !== "COMMIT" || commits === 2)
            ) {
              blocked = true
              blockedIndex = dispatched.length - 1
              block(600)
            }

            return result
          },
          release(destroy) {
            client.release(destroy)
          },
        }
      },
    }

    const timed = createPostgresDocumentService(observing, {
      ...config,
      timeoutMs: 500,
    })

    const id = `app:deadline-${crypto.randomUUID()}`
    const input = save(id)
    await assert.rejects(timed.mutate(input, context("owner", 500)), {
      code:
        phase === "INSERT INTO editor_operations" || phase === "COMMIT"
          ? "uncertain"
          : "aborted",
    })
    assert(blockedIndex >= 0)

    const later = dispatched
      .slice(blockedIndex + 1)
      .filter((sql) => sql !== "ROLLBACK")

    evidence.deadlines.push({
      phase,
      dispatched,
      later,
      durable: (await service.read(id, context())) !== null,
    })
    assert.deepEqual(later, [], `late SQL after ${phase}`)

    if (phase === "COMMIT") {
      assert(await service.read(id, context()))
      assert.equal((await service.mutate(input, context())).status, "committed")
    } else {
      assert.equal(await service.read(id, context()), null)
    }
  }

  checks.push(
    "absolute deadline after awaited native responses prevents later dispatch; COMMIT remains uncertain",
  )

  let sleepDispatched = false

  const slowPool: DocumentPgPool = {
    async connect() {
      const client = await pool.connect()

      return {
        query(query) {
          if (query.text.startsWith("SELECT pg_advisory")) {
            assert(query.query_timeout <= 100)
            sleepDispatched = true

            return client.query({
              ...query,
              text: "SELECT pg_sleep(5)",
              values: [],
            })
          }

          return client.query(query)
        },
        release(destroy) {
          client.release(destroy)
        },
      }
    },
  }

  const slow = createPostgresDocumentService(slowPool, config)
  const started = Date.now()
  await assert.rejects(slow.read("app:sleep", context("owner", 100)))
  assert(sleepDispatched)
  assert(Date.now() - started < 2000)
  assert.equal((await pool.query("SELECT 1 ok")).rows[0].ok, 1)
  checks.push(
    "real pg_sleep query uses remaining credential budget and subsequent pool query succeeds",
  )

  const locker = await pool.connect()
  await locker.query("BEGIN")
  await locker.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    "app:locked",
  ])

  try {
    const controller = new AbortController()

    const pending = service.read("app:locked", {
      ...context(),
      signal: controller.signal,
    })

    await delay(30)
    controller.abort()
    await assert.rejects(pending)
    await assert.rejects(service.read("app:locked", context("owner", 40)))
  } finally {
    await locker.query("ROLLBACK")
    locker.release()
  }

  assert.equal(await service.read("app:locked", context()), null)

  const single = new Pool({
    ...settings,
    max: 1,
    options: `-c search_path=${schema},pg_catalog`,
  })

  const held = await single.connect()

  try {
    const timed = createPostgresDocumentService(single, config)
    await assert.rejects(timed.read("app:acquire", context("owner", 30)))
  } finally {
    held.release()
  }

  await delay(30)
  assert.equal((await single.query("SELECT 1 ok")).rows[0].ok, 1)
  await single.end()
  checks.push(
    "native locked-query abort and acquisition timeout clean up; pools reusable",
  )
  evidence.status = "passed"
} catch (error) {
  evidence.status = "failed"
  evidence.failure =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : "unknown failure"
  process.exitCode = 1
} finally {
  if (httpServer) {
    httpServer.closeAllConnections()
    await new Promise<void>((done) => httpServer?.close(() => done()))
  }

  if (issuerServer) {
    issuerServer.closeAllConnections()
    await new Promise<void>((done) => issuerServer?.close(() => done()))
  }

  await pool.end()
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
  assert.equal(
    (
      await admin.query(
        "SELECT count(*)::int n FROM pg_namespace WHERE nspname=$1",
        [schema],
      )
    ).rows[0].n,
    0,
  )
  await admin.end()
  evidence.cleaned = true
  writeFileSync(artifact, JSON.stringify(evidence, null, 2))
  console.info(JSON.stringify({ status: evidence.status, checks, artifact }))
}
