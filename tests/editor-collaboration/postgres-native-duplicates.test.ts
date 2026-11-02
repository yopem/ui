import { createPostgresCollaborationLog } from "@editor/server/collaboration-postgres"
import { expect, test } from "bun:test"
import { rejects } from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { Pool } from "pg"
import * as Y from "yjs"

const generation = "a".repeat(64)

function context(signal = new AbortController().signal) {
  return {
    identity: { provider: "openauth" as const, userId: "alice" },
    credentialExpiresAt: Date.now() + 60000,
    signal,
    deadline: Date.now() + 10000,
  }
}

test("native PostgreSQL rejects duplicate snapshots before arbitrary initialization", async function nativePostgresDuplicates() {
  const fixture = process.env.EDITOR_PG_FIXTURE

  if (!fixture)
    throw new Error(
      "EDITOR_PG_FIXTURE must name a prepared native PostgreSQL TLS fixture",
    )

  const settings = {
    host: "127.0.0.1",
    port: Number((await readFile(resolve(fixture, "port"), "utf8")).trim()),
    user: "editor_fixture",
    database: "postgres",
    password: (await readFile(resolve(fixture, "password"), "utf8")).trim(),
    ssl: {
      ca: await readFile(resolve(fixture, "cluster/server.crt")),
      rejectUnauthorized: true,
    },
    connectionTimeoutMillis: 2000,
  }

  const schema = `collab_${crypto.randomUUID().replaceAll("-", "")}`
  const admin = new Pool(settings)

  const pool = new Pool({
    ...settings,
    options: `-c search_path=${schema},pg_catalog`,
  })

  try {
    await admin.query(`CREATE SCHEMA ${schema}`)

    for (const path of [
      "packages/editor/src/server/migrations/postgres/0001-document-snapshots.sql",
      "packages/editor/src/server/collaboration/0002-collaboration.sql",
    ])
      await pool.query(await readFile(path, "utf8"))
    await pool.query(
      "INSERT INTO editor_documents VALUES($1,$2,1,'snapshot',$3,1,0,$4)",
      [
        "doc:duplicate",
        generation,
        '{"root":{"type":"root","children":[]}}',
        "b".repeat(64),
      ],
    )
    await pool.query("INSERT INTO editor_generations VALUES($1,$2)", [
      generation,
      "doc:duplicate",
    ])

    const log = createPostgresCollaborationLog({
      timeoutMs: 5000,
      maxConcurrent: 2,
      policy() {
        return Promise.resolve(true)
      },
      transactions: {
        async run(signal, deadline, work) {
          const client = await pool.connect()

          try {
            await client.query("BEGIN")

            const result = await work(async function query(sql, values) {
              signal.throwIfAborted()

              if (Date.now() >= deadline) throw new Error("deadline")

              return (await client.query(sql, values)).rows
            })

            signal.throwIfAborted()

            if (Date.now() >= deadline) throw new Error("deadline")
            await client.query("COMMIT")

            return result
          } catch (error) {
            await client.query("ROLLBACK")
            throw error
          } finally {
            client.release()
          }
        },
      },
    })

    let calls = 0
    const update = new Y.Doc()
    update.getText("content").insert(0, "ignored")
    const bytes = Y.encodeStateAsUpdate(update)
    update.destroy()

    const input = {
      documentId: "doc:duplicate",
      generation,
      revision: "1",
      initialize() {
        calls++

        return Promise.resolve(bytes)
      },
    }

    for (const raw of [
      '{"root":{"type":"root","children":[],"nested":{"x":1,"x":2}}}',
      '{"root":{"type":"root","children":[],"nested":{"x":1,"\\u0078":2}}}',
      '{"root":null,"root":{"type":"root","children":[]}}',
    ]) {
      await pool.query("UPDATE editor_documents SET state_json=$1", [raw])
      const before = (await pool.query("SELECT * FROM editor_documents")).rows

      for (let attempt = 0; attempt < 2; attempt++) {
        await rejects(log.initialize(input, context()), /invalid/)
        expect(calls).toBe(0)
        expect(
          (await pool.query("SELECT * FROM editor_documents")).rows,
        ).toEqual(before)
        expect(
          (await pool.query("SELECT * FROM editor_collaboration_heads")).rows,
        ).toHaveLength(0)
        expect(
          (await pool.query("SELECT * FROM editor_collaboration_updates")).rows,
        ).toHaveLength(0)
      }
    }

    const cancelled = new AbortController()
    cancelled.abort()
    await rejects(log.initialize(input, context(cancelled.signal)), /aborted/)
    expect(calls).toBe(0)

    const valid =
      '{"root":{"type":"root","children":[],"nested":{"x":1}},"other":{"x":2}}'

    await pool.query("UPDATE editor_documents SET state_json=$1", [valid])
    expect((await log.initialize(input, context())).revision).toBe("2")
    expect(calls).toBe(1)
    expect(
      (await pool.query("SELECT state_json FROM editor_documents")).rows[0]
        ?.state_json,
    ).toBe(valid)
  } finally {
    await pool.end()
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await admin.end()
  }
}, 30000)
