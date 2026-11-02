import type { DocumentD1Binding } from "@editor/server/document-d1"
import type {
  DocumentConfig,
  DocumentContext,
  DocumentMutation,
  DocumentResult,
} from "@editor/server/document-model"
import type { DocumentPgPool } from "@editor/server/document-postgres"

import { createD1DocumentService } from "@editor/server/document-d1"
import { createDocumentHttpHandler } from "@editor/server/document-http"
import { createPostgresDocumentService } from "@editor/server/document-postgres"
import { PGlite } from "@electric-sql/pglite"
import { expect, test } from "bun:test"
import { Miniflare } from "miniflare"
import { readFile } from "node:fs/promises"

async function rejection(work: Promise<unknown>) {
  try {
    await work
  } catch (error) {
    if (error instanceof Error) return error
    throw new Error("Non-error rejection")
  }

  throw new Error("Expected rejection")
}

const valid = '{"root":{"type":"root","children":[]}}'

const legacy =
  '{ "root" : { "children" : [], "type" : "root" }, "a": {"x":1}, "b":{"x":2} }'

const duplicate = '{"root":{"type":"root","children":[],"t\\u0079pe":"root"}}'

const config: DocumentConfig = {
  policy: () => Promise.resolve(true),
  validateState: () => true,
  timeoutMs: 10000,
  maxConcurrent: 4,
}

function context(): DocumentContext {
  return {
    identity: { provider: "openauth", userId: "user" },
    signal: new AbortController().signal,
    deadline: Date.now() + 20000,
  }
}

function saved(result: DocumentResult) {
  if (result.status !== "committed") throw new Error("expected commit")

  return result.record
}

function save(
  documentId: string,
  expected: DocumentMutation["expected"],
  state = valid,
): DocumentMutation {
  return {
    documentId,
    operationId: crypto.randomUUID(),
    expected,
    change: { kind: "save", schemaVersion: 1, state },
  }
}

for (const dialect of ["d1", "postgres"] as const) {
  test(`${dialect} preserves raw legacy heads and historical receipts without repair`, async () => {
    const migration = await readFile(
      new URL(
        `../../packages/editor/src/server/migrations/${dialect}/0001-document-snapshots.sql`,
        import.meta.url,
      ),
      "utf8",
    )

    let mf: Miniflare | undefined
    let engine: PGlite | undefined

    let sql: (
      text: string,
      values?: (string | number | null)[],
    ) => Promise<unknown[]>

    let service: ReturnType<typeof createD1DocumentService>

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
              env: { DB: { type: "d1", id: "duplicate-contract" } },
            },
          },
        ],
      })
      const db = await mf.getD1Database("DB")
      await db.batch(
        migration
          .split(";")
          .filter((text) => text.trim())
          .map((text) => db.prepare(text)),
      )

      const binding: DocumentD1Binding = {
        withSession: (constraint) => db.withSession(constraint),
      }

      service = createD1DocumentService(binding, config)
      sql = async (text, values = []) =>
        (
          await db
            .prepare(text)
            .bind(...values)
            .all()
        ).results
    } else {
      engine = new PGlite()
      await engine.exec(migration)
      const database = engine

      const pool: DocumentPgPool = {
        connect() {
          return Promise.resolve({
            query: (query) => database.query(query.text, query.values),
            release: () => undefined,
          })
        },
      }

      service = createPostgresDocumentService(pool, config)
      sql = async (text, values = []) =>
        (
          await database.query(
            text.replaceAll("?", () => `$${valuesIndex++}`),
            values,
          )
        ).rows
    }

    let valuesIndex = 1

    function query(text: string, values: (string | number | null)[] = []) {
      valuesIndex = 1

      return sql(text, values)
    }

    async function snapshot(id: string) {
      return [
        await query("SELECT * FROM editor_documents WHERE document_id=?", [id]),
        await query("SELECT * FROM editor_generations WHERE document_id=?", [
          id,
        ]),
        await query(
          "SELECT * FROM editor_operations WHERE document_id=? ORDER BY operation_id",
          [id],
        ),
      ]
    }

    try {
      const id = `app:duplicate-${dialect}`
      const first = save(id, { kind: "absent" }, legacy)
      const original = saved(await service.mutate(first, context()))

      const later = saved(
        await service.mutate(
          save(id, { kind: "etag", etag: original.etag }),
          context(),
        ),
      )

      expect(saved(await service.mutate(first, context()))).toEqual(original)
      await query(
        "UPDATE editor_operations SET state_json=? WHERE document_id=? AND operation_id=?",
        [duplicate, id, first.operationId],
      )
      const receiptBefore = await snapshot(id)

      for (let i = 0; i < 2; i++)
        expect(await rejection(service.mutate(first, context()))).toMatchObject(
          {
            code: "uncertain",
          },
        )
      expect(
        await rejection(
          service.mutate(
            {
              ...first,
              change: {
                kind: "save",
                schemaVersion: 1,
                state: '{"root":{"type":"root","children":[]},"changed":true}',
              },
            },
            context(),
          ),
        ),
      ).toMatchObject({ code: "operation-reuse" })
      expect(
        await rejection(
          service.mutate(first, {
            ...context(),
            identity: { provider: "better-auth", userId: "user" },
          }),
        ),
      ).toMatchObject({ code: "operation-reuse" })
      expect(
        await rejection(
          service.mutate(first, {
            ...context(),
            identity: { provider: "openauth", userId: "other" },
          }),
        ),
      ).toMatchObject({ code: "operation-reuse" })
      expect(
        await rejection(
          service.mutate(
            { ...first, expected: { kind: "etag", etag: later.etag } },
            context(),
          ),
        ),
      ).toMatchObject({ code: "operation-reuse" })
      expect(await snapshot(id)).toEqual(receiptBefore)
      expect((await service.read(id, context()))?.etag).toBe(later.etag)
      await query(
        "UPDATE editor_documents SET state_json=? WHERE document_id=?",
        [duplicate, id],
      )
      const headBefore = await snapshot(id)
      expect(await rejection(service.read(id, context()))).toMatchObject({
        code: "corrupt",
      })
      expect(await rejection(service.mutate(first, context()))).toMatchObject({
        code: "corrupt",
      })
      expect(
        await rejection(
          service.mutate(
            save(id, { kind: "etag", etag: later.etag }),
            context(),
          ),
        ),
      ).toMatchObject({ code: "corrupt" })
      expect(
        await rejection(
          service.mutate(
            {
              ...save(id, { kind: "etag", etag: later.etag }),
              change: { kind: "delete" },
            },
            context(),
          ),
        ),
      ).toMatchObject({ code: "corrupt" })

      const http = createDocumentHttpHandler({
        origin: "https://editor.example",
        basePath: "/documents/",
        service,
        authenticate: () =>
          Promise.resolve({
            status: "authenticated",
            identity: context().identity,
          }),
        policy: () => true,
        verifyCsrf: () => true,
        timeoutMs: 10000,
        maxConcurrent: 2,
      })

      const response = await http(
        new Request(`https://editor.example/documents/${id}`),
      )

      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: "unavailable" })
      expect(await snapshot(id)).toEqual(headBefore)
    } finally {
      if (mf) await mf.dispose()

      if (engine) await engine.close()
    }
  }, 60000)
}
