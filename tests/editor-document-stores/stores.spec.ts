import type { DocumentD1Binding } from "@editor/server/document-d1"
import type {
  DocumentConfig,
  DocumentContext,
  DocumentMutation,
  DocumentResult,
  JsonValue,
} from "@editor/server/document-model"
import type {
  DocumentPgClient,
  DocumentPgPool,
} from "@editor/server/document-postgres"
import type { Pool } from "pg"

import { createD1DocumentService } from "@editor/server/document-d1"
import { createDocumentHttpHandler } from "@editor/server/document-http"
import { canonical } from "@editor/server/document-model"
import { createPostgresDocumentService } from "@editor/server/document-postgres"
import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Miniflare } from "miniflare"
import { readFile } from "node:fs/promises"
import { z } from "zod"

import { nativeSnapshots } from "./native-snapshots"

function pgCompatibility(pool: Pool): DocumentPgPool {
  return pool
}

void pgCompatibility

const supportedState = z.object({
  root: z.object({
    type: z.literal("root"),
    children: z.array(z.object({ type: z.literal("text"), text: z.string() })),
  }),
})

function validateState(state: JsonValue, version: number): boolean {
  return version === 1 && supportedState.safeParse(state).success
}

function configuration(): DocumentConfig {
  return {
    policy: function policy() {
      return Promise.resolve(true as const)
    },
    validateState,
    maxConcurrent: 8,
    timeoutMs: 5000,
  }
}

function context(): DocumentContext {
  return {
    identity: { provider: "openauth", userId: "user" },
    signal: new AbortController().signal,
    deadline: Date.now() + 10000,
  }
}

function state(text: string) {
  return JSON.stringify({
    root: { type: "root", children: [{ type: "text", text }] },
  })
}

function save(
  id: string,
  expected: DocumentMutation["expected"],
  text: string,
  operationId = crypto.randomUUID(),
): DocumentMutation {
  return {
    documentId: id,
    expected,
    operationId,
    change: { kind: "save", schemaVersion: 1, state: state(text) },
  }
}

function record(result: DocumentResult) {
  expect(result.status).toBe("committed")

  if (result.status !== "committed") throw new Error("missing result")

  return result.record
}

for (const dialect of ["d1", "postgres"] as const) {
  describe(dialect, function suite() {
    let mf: Miniflare
    let engine: PGlite
    let binding: DocumentD1Binding
    let pool: DocumentPgPool
    let service: ReturnType<typeof createD1DocumentService>
    let sessions = 0
    const lifecycle: string[] = []

    async function sql(text: string) {
      if (dialect === "postgres") return (await engine.query(text)).rows
      const session = binding.withSession("first-primary")

      return (await session.prepare(text).all()).results
    }

    test("native snapshot boundaries persist and replay without data loss", async function nativeBoundary() {
      const examples = nativeSnapshots()

      const allowed = new Set(
        examples.map((example) => canonical(example.state)),
      )

      const config = {
        ...configuration(),
        validateState(value: JsonValue, version: number) {
          return version === 1 && allowed.has(canonical(value))
        },
      }

      const nativeService =
        dialect === "d1"
          ? createD1DocumentService(binding, config)
          : createPostgresDocumentService(pool, config)

      for (const example of examples) {
        const raw = JSON.stringify(example.state)
        expect(new TextEncoder().encode(raw).length).toBeLessThanOrEqual(
          1048576,
        )

        const input: DocumentMutation = {
          documentId: example.documentId,
          operationId: crypto.randomUUID(),
          expected: { kind: "absent" },
          change: { kind: "save", schemaVersion: 1, state: raw },
        }

        const saved = record(await nativeService.mutate(input, context()))
        expect(saved.state).toEqual(example.state)
        expect(
          (await nativeService.read(example.documentId, context()))?.state,
        ).toEqual(example.state)
        expect(record(await nativeService.mutate(input, context()))).toEqual(
          saved,
        )
      }
    }, 60000)

    test("operation receipt binds authenticated actor", async function actor() {
      const input = save("app:actor-binding", { kind: "absent" }, "actor")
      record(await service.mutate(input, context()))
      expect(
        service.mutate(input, {
          ...context(),
          identity: { provider: "openauth", userId: "another-user" },
        }),
      ).rejects.toMatchObject({ code: "operation-reuse" })
      expect((await service.read(input.documentId, context()))?.revision).toBe(
        "1",
      )
    }, 60000)

    test("authenticated HTTP lifecycle and strict write boundaries", async function http() {
      const identity = { provider: "openauth", userId: "user" } as const
      let expiry: number | undefined
      let allowed = true
      let csrf: boolean | "unavailable" = true

      const handler = createDocumentHttpHandler({
        origin: "https://editor.example",
        basePath: "/documents/",
        service: {
          read: (...args) => service.read(...args),
          mutate: (...args) => service.mutate(...args),
        },
        authenticate: function authenticate() {
          return Promise.resolve({
            status: "authenticated" as const,
            identity,
            credentialExpiresAt: expiry,
          })
        },
        policy: function policy() {
          return allowed
        },
        verifyCsrf: function verifyCsrf() {
          return csrf
        },
        timeoutMs: 5000,
        maxConcurrent: 8,
      })

      const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch: function fetchRequest(request) {
          return handler(
            new Request(
              "https://editor.example" +
                new URL(request.url).pathname +
                new URL(request.url).search,
              request,
            ),
          )
        },
      })

      try {
        const body = JSON.stringify({
          schemaVersion: 1,
          state: JSON.parse(state("http")),
        })

        function call(
          method: string,
          headers: Record<string, string> = {},
          payload?: string,
          path = "app:http",
        ) {
          const requestHeaders = new Headers(headers)

          if (method !== "GET") {
            for (const [key, value] of Object.entries({
              origin: "https://editor.example",
              "x-csrf-token": "verified",
              "content-type": "application/json",
            })) {
              if (!requestHeaders.has(key)) requestHeaders.set(key, value)
            }
          }

          return fetch(`${server.url}documents/${path}`, {
            method,
            headers: requestHeaders,
            body: payload,
          })
        }

        expect((await call("PUT", {}, body)).status).toBe(428)
        const operation = crypto.randomUUID()

        const createHeaders = {
          "if-none-match": "*",
          "idempotency-key": operation,
        }

        const created = await call("PUT", createHeaders, body)
        expect(created.status).toBe(200)
        const tag = created.headers.get("etag")

        if (!tag) throw new Error("missing etag")
        expect((await call("GET")).headers.get("etag")).toBe(tag)
        expect(
          (await call("PUT", createHeaders, body)).headers.get("etag"),
        ).toBe(tag)
        expect(
          (await call("PUT", createHeaders, body.replace("http", "changed")))
            .status,
        ).toBe(409)
        expect(
          (
            await call(
              "PUT",
              { ...createHeaders, "idempotency-key": crypto.randomUUID() },
              body,
            )
          ).status,
        ).toBe(412)

        for (const origin of [
          "null",
          "https://evil.example",
          "https://editor.example/",
          "https://editor.example, https://evil.example",
          "https://sub.editor.example",
          "",
        ]) {
          expect(
            (await call("PUT", { ...createHeaders, origin }, body)).status,
          ).toBe(403)
        }

        csrf = false
        expect((await call("PUT", createHeaders, body)).status).toBe(403)
        csrf = "unavailable"
        expect((await call("PUT", createHeaders, body)).status).toBe(503)
        csrf = true
        expiry = Date.now() - 1
        expect((await call("GET")).status).toBe(401)
        expiry = undefined
        allowed = false
        expect((await call("GET")).status).toBe(403)
        allowed = true

        for (const path of [
          "bad",
          "app%3Ahttp",
          "app:%252f",
          "app:http?token=secret",
          `app:${"x".repeat(257)}`,
        ]) {
          expect((await call("GET", {}, undefined, path)).status).toBe(400)
        }

        for (const etag of [
          "*",
          `W/${tag}`,
          `${tag}, ${tag}`,
          '"' + "a".repeat(64) + ':9223372036854775808"',
        ]) {
          expect(
            (
              await call(
                "PUT",
                { "if-match": etag, "idempotency-key": crypto.randomUUID() },
                body,
              )
            ).status,
          ).toBe(400)
        }

        expect(
          (
            await call(
              "PUT",
              { ...createHeaders, "content-type": "text/plain" },
              body,
            )
          ).status,
        ).toBe(415)
        expect((await call("PUT", createHeaders, "{}")).status).toBe(400)
        expect(
          (await call("PUT", createHeaders, "x".repeat(1048577))).status,
        ).toBe(413)

        const removed = await call("DELETE", {
          "if-match": tag,
          "idempotency-key": crypto.randomUUID(),
        })

        expect(removed.status).toBe(200)
        expect((await call("GET")).status).toBe(404)

        const recreated = await call(
          "PUT",
          { ...createHeaders, "idempotency-key": crypto.randomUUID() },
          body,
        )

        expect(recreated.status).toBe(200)
        expect(recreated.headers.get("etag")).not.toBe(tag)
        expect(
          (await call("PUT", createHeaders, body)).headers.get("etag"),
        ).toBe(tag)
        const method = await call("POST")
        expect(method.status).toBe(405)
        expect(method.headers.get("cache-control")).toBe("no-store")
      } finally {
        await server.stop(true)
      }
    }, 60000)

    beforeAll(async function setup() {
      const migration = await readFile(
        new URL(
          `../../packages/editor/src/server/migrations/${dialect}/0001-document-snapshots.sql`,
          import.meta.url,
        ),
        "utf8",
      )

      if (dialect === "d1") {
        mf = new Miniflare({
          workers: [
            {
              config: {
                name: "snapshot",
                compatibilityDate: "2026-09-01",
                manifest: {
                  mainModule: "worker.js",
                  modules: {
                    "worker.js": {
                      type: "esm",
                      contents:
                        "export default { fetch() { return new Response('fixture') } }",
                    },
                  },
                },
                env: { DB: { type: "d1", id: "snapshot-fixture" } },
              },
            },
          ],
        })
        const db = await mf.getD1Database("DB")
        await db.batch(
          migration
            .split(";")
            .filter((statement) => statement.trim())
            .map((statement) => db.prepare(statement)),
        )
        binding = {
          withSession(constraint) {
            expect(constraint).toBe("first-primary")
            sessions++

            return db.withSession(constraint)
          },
        }
        service = createD1DocumentService(binding, configuration())
      } else {
        engine = new PGlite()
        await engine.exec(migration)
        let previous = Promise.resolve()
        pool = {
          async connect() {
            const ready = previous
            const waiting = Promise.withResolvers<void>()
            const unlock = waiting.resolve

            previous = waiting.promise
            await ready
            lifecycle.push("acquire")

            const client: DocumentPgClient = {
              query(config) {
                lifecycle.push(config.text.split(" ")[0] ?? "query")

                return engine.query(config.text, config.values)
              },
              release(destroy) {
                lifecycle.push(destroy ? "destroy" : "release")
                unlock()
              },
            }

            return client
          },
        }
        service = createPostgresDocumentService(pool, configuration())
      }
    }, 30000)
    afterAll(async function cleanup() {
      if (mf) await mf.dispose()

      if (engine) await engine.close()
    })
    test("CAS, ABA, retained receipts, tombstone, recreate, canonical requests", async function cas() {
      const id = "tenant:cas"
      const first = save(id, { kind: "absent" }, "A")
      const a = record(await service.mutate(first, context()))
      expect((await service.read(id, context()))?.etag).toBe(a.etag)

      const attempts = [
        save(id, { kind: "etag", etag: a.etag }, "B"),
        save(id, { kind: "etag", etag: a.etag }, "C"),
      ]

      const results = await Promise.all(
        attempts.map((input) => service.mutate(input, context())),
      )

      expect(
        results.filter((result) => result.status === "committed"),
      ).toHaveLength(1)
      const winner = results.find((result) => result.status === "committed")

      if (!winner) throw new Error("no winner")

      const back = record(
        await service.mutate(
          save(id, { kind: "etag", etag: winner.record.etag }, "A"),
          context(),
        ),
      )

      expect(back.etag).not.toBe(a.etag)
      expect((await service.mutate(attempts[0], context())).status).toBe(
        results[0].status,
      )

      const deletion: DocumentMutation = {
        documentId: id,
        expected: { kind: "etag", etag: back.etag },
        operationId: crypto.randomUUID(),
        change: { kind: "delete" },
      }

      const deleted = record(await service.mutate(deletion, context()))
      expect(deleted.deleted).toBe(true)
      expect((await service.read(id, context()))?.state).toBeNull()

      const recreated = record(
        await service.mutate(save(id, { kind: "absent" }, "new"), context()),
      )

      expect(recreated.generation).not.toBe(a.generation)
      expect(recreated.revision).toBe("1")
      expect(record(await service.mutate(first, context()))).toEqual(a)
      expect(record(await service.mutate(deletion, context()))).toEqual(deleted)
      expect(
        (
          await service.mutate(
            save(id, { kind: "etag", etag: a.etag }, "stale"),
            context(),
          )
        ).status,
      ).toBe("conflict")
      expect(
        service.mutate(
          {
            ...first,
            change: { kind: "save", schemaVersion: 1, state: state("changed") },
          },
          context(),
        ),
      ).rejects.toMatchObject({ code: "operation-reuse" })
      const ordered = save("tenant:canonical", { kind: "absent" }, "same")
      const original = record(await service.mutate(ordered, context()))
      expect(
        record(
          await service.mutate(
            {
              ...ordered,
              change: {
                kind: "save",
                schemaVersion: 1,
                state:
                  '{"root":{"children":[{"text":"same","type":"text"}],"type":"root"}}',
              },
            },
            context(),
          ),
        ),
      ).toEqual(original)

      if (dialect === "d1") expect(sessions).toBeGreaterThan(0)
      else {
        expect(lifecycle).toContain("BEGIN")
        expect(lifecycle).toContain("COMMIT")
        expect(lifecycle.at(-1)).toBe("release")
      }
    }, 60000)
    test("zero-row CAS has no receipt or generation side effects", async function noEffects() {
      const id = "tenant:zero"

      const a = record(
        await service.mutate(save(id, { kind: "absent" }, "A"), context()),
      )

      const before = await sql(
        "SELECT COUNT(*) AS count FROM editor_operations",
      )

      const generations = await sql(
        "SELECT COUNT(*) AS count FROM editor_generations",
      )

      expect(
        (await service.mutate(save(id, { kind: "absent" }, "B"), context()))
          .status,
      ).toBe("conflict")
      expect(
        (
          await service.mutate(
            save(id, { kind: "etag", etag: a.etag.replace(":1", ":2") }, "B"),
            context(),
          )
        ).status,
      ).toBe("conflict")
      expect(
        await sql("SELECT COUNT(*) AS count FROM editor_operations"),
      ).toEqual(before)
      expect(
        await sql("SELECT COUNT(*) AS count FROM editor_generations"),
      ).toEqual(generations)
    }, 60000)
    test("receipt failure rolls back mutation", async function rollback() {
      const id = "tenant:rollback"

      if (dialect === "d1")
        await sql(
          "CREATE TRIGGER fail_receipt BEFORE INSERT ON editor_operations WHEN NEW.document_id='tenant:rollback' BEGIN SELECT RAISE(ABORT,'fault'); END",
        )
      else
        await sql(
          "ALTER TABLE editor_operations ADD CONSTRAINT receipt_fault CHECK(document_id<>'tenant:rollback')",
        )
      expect(
        service.mutate(save(id, { kind: "absent" }, "A"), context()),
      ).rejects.toMatchObject({ code: "uncertain" })
      expect(await service.read(id, context())).toBeNull()
      expect(
        await sql(
          "SELECT generation FROM editor_generations WHERE document_id='tenant:rollback'",
        ),
      ).toEqual([])

      if (dialect === "d1") await sql("DROP TRIGGER fail_receipt")
      else {
        await sql("ALTER TABLE editor_operations DROP CONSTRAINT receipt_fault")
        expect(lifecycle).toContain("ROLLBACK")
      }
    }, 60000)
    test("lost commit response retries through durable receipt", async function lostResponse() {
      let lose = true

      const faultBinding: DocumentD1Binding = {
        withSession(constraint) {
          const session = binding.withSession(constraint)

          return {
            prepare: (text) => session.prepare(text),
            async batch(statements) {
              const result = await session.batch(statements)

              if (lose) {
                lose = false
                throw new Error("lost response")
              }

              return result
            },
          }
        },
      }

      const faultPool: DocumentPgPool = {
        async connect() {
          const client = await pool.connect()
          let writing = false

          return {
            release: (destroy) => client.release(destroy),
            async query(config) {
              if (
                config.text.startsWith("INSERT INTO editor_documents") ||
                config.text.startsWith("UPDATE editor_documents")
              )
                writing = true
              const result = await client.query(config)

              if (config.text === "COMMIT" && writing && lose) {
                lose = false
                throw new Error("lost response")
              }

              return result
            },
          }
        },
      }

      const fault =
        dialect === "d1"
          ? createD1DocumentService(faultBinding, configuration())
          : createPostgresDocumentService(faultPool, configuration())

      const http = createDocumentHttpHandler({
        origin: "https://editor.example",
        basePath: "/documents/",
        service: fault,
        authenticate: function authenticate() {
          return Promise.resolve({
            status: "authenticated" as const,
            identity: context().identity,
          })
        },
        policy: function policy() {
          return true
        },
        verifyCsrf: function verifyCsrf() {
          return true
        },
        timeoutMs: 5000,
        maxConcurrent: 8,
      })

      const operationId = crypto.randomUUID()

      function retryRequest() {
        return new Request(
          "https://editor.example/documents/tenant:http-lost",
          {
            method: "PUT",
            headers: {
              origin: "https://editor.example",
              "x-csrf-token": "token",
              "content-type": "application/json",
              "if-none-match": "*",
              "idempotency-key": operationId,
            },
            body: JSON.stringify({
              schemaVersion: 1,
              state: JSON.parse(state("A")),
            }),
          },
        )
      }

      const uncertain = await http(retryRequest())
      expect(uncertain.status).toBe(503)
      expect(await uncertain.json()).toEqual({
        error: "uncertain",
        retry: "same-operation",
      })
      const retried = await http(retryRequest())
      expect(retried.status).toBe(200)
      const committed = await service.read("tenant:http-lost", context())

      if (!committed) throw new Error("missing committed HTTP snapshot")
      expect(retried.headers.get("etag")).toBe(committed.etag)
      lose = true

      const input = save("tenant:lost-response", { kind: "absent" }, "A")
      expect(fault.mutate(input, context())).rejects.toMatchObject({
        code: "uncertain",
      })
      const recovered = record(await service.mutate(input, context()))
      expect(recovered.revision).toBe("1")
      expect((await service.read(input.documentId, context()))?.etag).toBe(
        recovered.etag,
      )
    }, 60000)
    test("abort after dispatch can commit and retry resolves receipt", async function uncertainAbort() {
      const controller = new AbortController()

      const faultBinding: DocumentD1Binding = {
        withSession(constraint) {
          const session = binding.withSession(constraint)

          return {
            prepare: (text) => session.prepare(text),
            async batch(statements) {
              const result = await session.batch(statements)
              controller.abort()

              return result
            },
          }
        },
      }

      const faultPool: DocumentPgPool = {
        async connect() {
          const client = await pool.connect()
          let writing = false

          return {
            release: (destroy) => client.release(destroy),
            async query(config) {
              if (
                config.text.startsWith("INSERT INTO editor_documents") ||
                config.text.startsWith("UPDATE editor_documents")
              )
                writing = true
              const result = await client.query(config)

              if (config.text === "COMMIT" && writing) controller.abort()

              return result
            },
          }
        },
      }

      const fault =
        dialect === "d1"
          ? createD1DocumentService(faultBinding, configuration())
          : createPostgresDocumentService(faultPool, configuration())

      const input = save("tenant:aborted-commit", { kind: "absent" }, "A")
      expect(
        fault.mutate(input, { ...context(), signal: controller.signal }),
      ).rejects.toMatchObject({ code: "uncertain" })
      expect(record(await service.mutate(input, context())).revision).toBe("1")

      if (dialect === "postgres") expect(lifecycle).toContain("destroy")
    }, 60000)
    test("deadline retains concurrency slot until host policy settles", async function policyBudget() {
      const waiting = Promise.withResolvers<true>()
      const entered = Promise.withResolvers<void>()
      const config = configuration()
      config.maxConcurrent = 1
      config.policy = function waitingPolicy() {
        entered.resolve()

        return waiting.promise
      }

      const bounded =
        dialect === "d1"
          ? createD1DocumentService(binding, config)
          : createPostgresDocumentService(pool, config)

      const pending = bounded.read("tenant:policy-budget", {
        ...context(),
        deadline: Date.now() + 30,
      })

      await entered.promise
      expect(pending).rejects.toMatchObject({ code: "aborted" })
      expect(
        bounded.read("tenant:policy-budget", context()),
      ).rejects.toMatchObject({ code: "budget" })
      waiting.resolve(true)
      await waiting.promise
    }, 60000)
    test("state depth, value and byte budgets reject without changing head", async function stateBudgets() {
      const id = "tenant:budgets"

      const a = record(
        await service.mutate(save(id, { kind: "absent" }, "A"), context()),
      )

      const inputs = [
        {
          raw:
            '{"root":{"type":"root","children":[' +
            Array.from({ length: 10 }, () =>
              JSON.stringify({ type: "text", text: "x".repeat(100000) }),
            ).join(",") +
            '],"extra":[' +
            Array.from({ length: 2500 }, () => "1e20").join(",") +
            "]}}",
          code: "budget",
        },
        { raw: state("x".repeat(1048576)), code: "invalid" },
        {
          raw:
            '{"root":{"type":"root","children":[],"deep":' +
            "[".repeat(65) +
            "0" +
            "]".repeat(65) +
            "}}",
          code: "budget",
        },
        {
          raw: JSON.stringify({
            root: { type: "root", children: [] },
            extra: Array.from({ length: 131073 }, () => 0),
          }),
          code: "budget",
        },
      ]

      for (const input of inputs)
        expect(
          service.mutate(
            {
              ...save(id, { kind: "etag", etag: a.etag }, "B"),
              change: { kind: "save", schemaVersion: 1, state: input.raw },
            },
            context(),
          ),
        ).rejects.toMatchObject({ code: input.code })
      expect((await service.read(id, context()))?.etag).toBe(a.etag)
    }, 60000)

    if (dialect === "postgres")
      test("cancelled pool acquisition destroys late client and bounds queue", async function lateAcquire() {
        const waiting = Promise.withResolvers<void>()
        const entered = Promise.withResolvers<void>()

        const delayedPool: DocumentPgPool = {
          async connect() {
            entered.resolve()
            await waiting.promise

            return pool.connect()
          },
        }

        const config = configuration()
        config.maxConcurrent = 1
        const bounded = createPostgresDocumentService(delayedPool, config)
        const controller = new AbortController()

        const pending = bounded.read("tenant:late-acquire", {
          ...context(),
          signal: controller.signal,
        })

        await entered.promise
        controller.abort()
        expect(pending).rejects.toMatchObject({ code: "aborted" })
        expect(
          bounded.read("tenant:late-acquire", context()),
        ).rejects.toMatchObject({ code: "budget" })

        const destroyed = lifecycle.filter(
          (entry) => entry === "destroy",
        ).length

        waiting.resolve()
        await waiting.promise
        await service.read("tenant:late-acquire", context())
        expect(lifecycle.filter((entry) => entry === "destroy").length).toBe(
          destroyed + 1,
        )
        expect(lifecycle.filter((entry) => entry === "acquire").length).toBe(
          lifecycle.filter(
            (entry) => entry === "release" || entry === "destroy",
          ).length,
        )
      }, 60000)
    test("signed64 counters remain exact and overflow fails closed", async function overflow() {
      const id = "tenant:counter"

      const a = record(
        await service.mutate(save(id, { kind: "absent" }, "A"), context()),
      )

      await sql(
        "UPDATE editor_documents SET revision=9007199254740993 WHERE document_id='tenant:counter'",
      )
      const large = await service.read(id, context())
      expect(large?.revision).toBe("9007199254740993")
      expect(
        record(
          await service.mutate(
            save(
              id,
              { kind: "etag", etag: `"${a.generation}:9007199254740993"` },
              "B",
            ),
            context(),
          ),
        ).revision,
      ).toBe("9007199254740994")
      await sql(
        "UPDATE editor_documents SET revision=9223372036854775807 WHERE document_id='tenant:counter'",
      )
      expect(
        service.mutate(
          save(
            id,
            { kind: "etag", etag: `"${a.generation}:9223372036854775807"` },
            "C",
          ),
          context(),
        ),
      ).rejects.toMatchObject({ code: "exhausted" })
    }, 60000)
    test("host schema validation, policy, bounds, aborts and mode fail closed", async function boundaries() {
      const id = "tenant:validation"
      const input = save(id, { kind: "absent" }, "safe")
      const a = record(await service.mutate(input, context()))

      for (const raw of [
        '{"root":{"type":"root","children":[{"type":"unknown"}]}}',
        "{}",
        "[1]",
        "x".repeat(1048577),
      ])
        expect(
          service.mutate(
            {
              ...save(id, { kind: "etag", etag: a.etag }, "bad"),
              change: { kind: "save", schemaVersion: 1, state: raw },
            },
            context(),
          ),
        ).rejects.toMatchObject({ code: "invalid" })
      expect(
        service.mutate(
          {
            ...input,
            change: {
              kind: "save",
              schemaVersion: 2,
              state: state("unsupported"),
            },
          },
          context(),
        ),
      ).rejects.toMatchObject({ code: "invalid" })
      expect((await service.read(id, context()))?.etag).toBe(a.etag)
      const deniedConfig = configuration()
      deniedConfig.policy = function deny() {
        return Promise.resolve(false as const)
      }

      const denied =
        dialect === "d1"
          ? createD1DocumentService(binding, deniedConfig)
          : createPostgresDocumentService(pool, deniedConfig)

      expect(denied.read(id, context())).rejects.toMatchObject({
        code: "denied",
      })
      deniedConfig.policy = function outage() {
        return Promise.reject(new Error("private details"))
      }

      expect(denied.read(id, context())).rejects.toMatchObject({
        code: "unavailable",
      })
      const aborted = context()
      aborted.signal = AbortSignal.abort()
      expect(service.read(id, aborted)).rejects.toMatchObject({
        code: "aborted",
      })
      expect(
        service.read(id, { ...context(), deadline: Date.now() - 1 }),
      ).rejects.toMatchObject({ code: "aborted" })
      expect(service.read("not-namespaced", context())).rejects.toMatchObject({
        code: "invalid",
      })
      await sql(
        "UPDATE editor_documents SET mode='yjs' WHERE document_id='tenant:validation'",
      )
      expect(service.read(id, context())).rejects.toMatchObject({
        code: "mode",
      })
      expect(
        service.mutate(
          save(id, { kind: "etag", etag: a.etag }, "bad"),
          context(),
        ),
      ).rejects.toMatchObject({ code: "mode" })
      await sql(
        'UPDATE editor_documents SET mode=\'snapshot\',state_json=\'{"root":{"type":"root","children":[{"type":"custom-unsupported"}]}}\' WHERE document_id=\'tenant:validation\'',
      )
      expect(service.read(id, context())).rejects.toMatchObject({
        code: "invalid",
      })
      expect(
        service.mutate(
          save(id, { kind: "etag", etag: a.etag }, "replacement"),
          context(),
        ),
      ).rejects.toMatchObject({ code: "invalid" })
      expect(
        service.mutate(
          {
            documentId: id,
            expected: { kind: "etag", etag: a.etag },
            operationId: crypto.randomUUID(),
            change: { kind: "delete" },
          },
          context(),
        ),
      ).rejects.toMatchObject({ code: "invalid" })
      expect(
        await sql(
          "SELECT state_json FROM editor_documents WHERE document_id='tenant:validation'",
        ),
      ).toEqual([
        {
          state_json:
            '{"root":{"type":"root","children":[{"type":"custom-unsupported"}]}}',
        },
      ])
    }, 60000)
  })
}
