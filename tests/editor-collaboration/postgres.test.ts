import {
  createPostgresCollaborationLog,
  type CollaborationTransactions,
  type CollaborationContext,
} from "@editor/server/collaboration-postgres"
import { PGlite } from "@electric-sql/pglite"
import { afterEach, describe, expect, test } from "bun:test"
import { rejects } from "node:assert/strict"
import { readFile } from "node:fs/promises"
import * as Y from "yjs"

const databases: PGlite[] = []

afterEach(async function closeDatabases() {
  for (const db of databases.splice(0)) await db.close()
})

const generation = "a".repeat(64)

function context(): CollaborationContext {
  return {
    identity: { provider: "openauth", userId: "alice" },
    credentialExpiresAt: Date.now() + 60000,
    signal: new AbortController().signal,
    deadline: Date.now() + 10000,
  }
}

function content(text: string) {
  const doc = new Y.Doc()
  doc.getText("content").insert(0, text)
  const bytes = Y.encodeStateAsUpdate(doc)
  doc.destroy()

  return bytes
}

function text(bytes: Uint8Array) {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, bytes)
  const result = doc.getText("content").toJSON()
  doc.destroy()

  return result
}

async function fixture() {
  const db = new PGlite()
  databases.push(db)
  await db.exec(
    await readFile(
      new URL(
        "../../packages/editor/src/server/migrations/postgres/0001-document-snapshots.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  await db.exec(
    await readFile(
      new URL(
        "../../packages/editor/src/server/collaboration/0002-collaboration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  await db.query(
    "INSERT INTO editor_documents VALUES($1,$2,1,'snapshot',$3,1,0,$4)",
    [
      "host/doc",
      generation,
      '{"root":{"type":"root","children":[],"text":"seed"}}',
      "b".repeat(64),
    ],
  )
  await db.query("INSERT INTO editor_generations VALUES($1,$2)", [
    generation,
    "host/doc",
  ])
  let denied = false
  let fault = false
  let loseReply = false

  const transactions: CollaborationTransactions = {
    async run(signal, deadline, work) {
      const result = await db.transaction(async function runTransaction(tx) {
        const result = await work(async function queryWithFaults(sql, values) {
          signal.throwIfAborted()

          if (Date.now() >= deadline) throw new Error("deadline")
          const result = await tx.query(sql, values)

          if (
            fault &&
            sql.startsWith("INSERT INTO editor_collaboration_updates")
          )
            throw new Error("injected rollback")

          return result.rows
        })

        signal.throwIfAborted()

        if (Date.now() >= deadline) throw new Error("deadline")

        return result
      })

      if (loseReply) {
        loseReply = false
        throw new Error("lost committed response")
      }

      return result
    },
  }

  const config = {
    transactions,
    timeoutMs: 1000,
    maxConcurrent: 4,
    policy: function documentPolicy() {
      return Promise.resolve(!denied)
    },
  }

  const first = createPostgresCollaborationLog(config)
  const second = createPostgresCollaborationLog(config)

  async function initialize() {
    return await first.initialize(
      {
        documentId: "host/doc",
        generation,
        revision: "1",
        initialize: function initializeSnapshot(snapshot) {
          expect(snapshot.schemaVersion).toBe(1)

          return Promise.resolve(content("seed"))
        },
      },
      context(),
    )
  }

  return {
    db,
    first,
    second,
    initialize,
    deny() {
      denied = true
    },
    fail() {
      fault = true
    },
    recover() {
      fault = false
    },
    lose() {
      loseReply = true
    },
  }
}

describe("PostgreSQL canonical-head collaboration log", function postgresContracts() {
  test("rejects duplicate snapshot keys before custom initialization and permits a valid retry", async function duplicateSnapshots() {
    const f = await fixture()

    const valid =
      '{"root":{"type":"root","children":[],"meta":{"x":1}},"other":{"x":2}}'

    const invalid = [
      '{"root":{"type":"root","children":[],"meta":{"x":1,"x":2}}}',
      '{"root":{"type":"root","children":[],"meta":{"x":1,"\\u0078":2}}}',
      '{"root":null,"root":{"type":"root","children":[]}}',
    ]

    let calls = 0

    const input = {
      documentId: "host/doc",
      generation,
      revision: "1",
      initialize() {
        calls++

        return Promise.resolve(content("ignored snapshot"))
      },
    }

    for (const raw of invalid) {
      await f.db.query("UPDATE editor_documents SET state_json=$1", [raw])
      const before = (await f.db.query("SELECT * FROM editor_documents")).rows

      for (let retry = 0; retry < 2; retry++) {
        await rejects(f.first.initialize(input, context()), /invalid/)
        expect(calls).toBe(0)
        expect(
          (await f.db.query("SELECT * FROM editor_documents")).rows,
        ).toEqual(before)
        expect(
          (await f.db.query("SELECT * FROM editor_collaboration_heads")).rows,
        ).toHaveLength(0)
        expect(
          (await f.db.query("SELECT * FROM editor_collaboration_updates")).rows,
        ).toHaveLength(0)
      }
    }

    const aborted = new AbortController()
    aborted.abort()
    await rejects(
      f.first.initialize(input, { ...context(), signal: aborted.signal }),
      /aborted/,
    )
    expect(calls).toBe(0)
    await f.db.query("UPDATE editor_documents SET state_json=$1", [valid])
    const result = await f.first.initialize(input, context())
    expect(calls).toBe(1)
    expect(text(result.state)).toBe("ignored snapshot")
    expect(result.revision).toBe("2")
    expect(
      (
        await f.db.query<{ state_json: string }>(
          "SELECT state_json FROM editor_documents",
        )
      ).rows[0]?.state_json,
    ).toBe(valid)
  })

  test("authoritative bootstrap, two replicas, durable append, bounded poll and recovery", async function replicaRecovery() {
    const f = await fixture()
    const boot = await f.initialize()
    expect(text(boot.state)).toBe("seed")
    const doc = new Y.Doc()
    Y.applyUpdate(doc, boot.state)
    doc.getText("content").insert(4, " shared")
    const update = Y.encodeStateAsUpdate(doc)

    const result = await f.first.append(
      {
        documentId: "host/doc",
        generation,
        revision: boot.revision,
        operationId: "op-000000000000001",
        update,
      },
      context(),
    )

    expect(result.revision).toBe("3")

    const polled = await f.second.poll(
      { documentId: "host/doc", generation, afterRevision: boot.revision },
      context(),
    )

    expect(polled.map((entry) => entry.revision)).toEqual(["3"])
    const recovered = await f.second.load("host/doc", context())
    expect(text(recovered.state)).toBe("seed shared")
    expect(recovered.revision).toBe("3")

    const rows = await f.db.query<{ mode: string; revision: string }>(
      "SELECT mode,revision::text FROM editor_documents",
    )

    expect(rows.rows).toEqual([{ mode: "yjs", revision: "3" }])
    doc.destroy()
  })

  test("one CAS winner; duplicate retry after ambiguous commit; mismatched receipt rejected", async function ambiguousCommit() {
    const f = await fixture()
    const boot = await f.initialize()
    const doc = new Y.Doc()
    Y.applyUpdate(doc, boot.state)
    doc.getText("content").insert(4, "!")

    const input = {
      documentId: "host/doc",
      generation,
      revision: boot.revision,
      operationId: "op-000000000000002",
      update: Y.encodeStateAsUpdate(doc),
    }

    f.lose()
    await rejects(f.first.append(input, context()), /uncertain/)
    const retried = await f.second.append(input, context())
    expect(retried.revision).toBe("3")
    await rejects(
      f.first.append({ ...input, update: content("different") }, context()),
      /conflict/,
    )

    const competing = await Promise.allSettled([
      f.first.append(
        { ...input, revision: "3", operationId: "op-000000000000003" },
        context(),
      ),
      f.second.append(
        { ...input, revision: "3", operationId: "op-000000000000004" },
        context(),
      ),
    ])

    expect(
      competing.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1)
    expect(
      (await f.db.query("SELECT * FROM editor_collaboration_updates")).rows,
    ).toHaveLength(2)
    doc.destroy()
  })

  test("validation and SQL rollback leave accepted state and receipts unchanged", async function rollback() {
    const f = await fixture()
    const boot = await f.initialize()

    const input = {
      documentId: "host/doc",
      generation,
      revision: boot.revision,
      operationId: "op-000000000000005",
      update: content("other"),
    }

    await rejects(
      f.first.append({ ...input, update: Uint8Array.of(255) }, context()),
    )
    expect((await f.first.load("host/doc", context())).revision).toBe("2")
    f.fail()
    await rejects(f.first.append(input, context()), /uncertain/)
    f.recover()
    expect(
      (await f.db.query("SELECT * FROM editor_collaboration_updates")).rows,
    ).toHaveLength(0)
    expect((await f.first.load("host/doc", context())).state).toEqual(
      boot.state,
    )
    expect((await f.first.append(input, context())).revision).toBe("3")
  })

  test("policy, missing expiry, snapshot ownership, generation and tombstones fail closed", async function lifecycleFences() {
    const f = await fixture()
    await rejects(f.first.load("host/doc", context()), /conflict/)
    await rejects(
      f.first.initialize(
        {
          documentId: "host/doc",
          generation: "c".repeat(64),
          revision: "1",
          initialize: function deniedInitializer() {
            return Promise.resolve(content("bad"))
          },
        },
        context(),
      ),
      /conflict/,
    )
    const boot = await f.initialize()
    await rejects(
      f.first.load("host/doc", {
        ...context(),
        credentialExpiresAt: Date.now(),
      }),
      /denied/,
    )
    await f.db.query(
      "UPDATE editor_documents SET deleted=1,state_json=NULL,revision=revision+1 WHERE document_id='host/doc'",
    )
    await rejects(
      f.first.append(
        {
          documentId: "host/doc",
          generation,
          revision: boot.revision,
          operationId: "op-000000000000006",
          update: content("bad"),
        },
        context(),
      ),
      /conflict/,
    )
    await rejects(
      f.first.poll(
        { documentId: "host/doc", generation, afterRevision: "2" },
        context(),
      ),
      /conflict/,
    )
    f.deny()
    await rejects(f.first.load("host/doc", context()), /denied/)
  })

  test("cooperative and noncooperative policy deadlines retain admission until settlement", async function policyDeadlines() {
    let calls = 0
    let finish: ((value: boolean) => void) | undefined

    const log = createPostgresCollaborationLog({
      transactions: {
        run() {
          calls++

          return Promise.reject(new Error("unexpected"))
        },
      },
      timeoutMs: 20,
      maxConcurrent: 1,
      policy: function stalledPolicy() {
        return new Promise<boolean>((resolve) => {
          finish = resolve
        })
      },
    })

    await rejects(log.load("host/doc", context()), /aborted/)
    await rejects(log.load("host/doc", context()), /budget/)
    finish?.(true)
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(calls).toBe(0)

    const cooperative = createPostgresCollaborationLog({
      transactions: {
        run() {
          return Promise.reject(new Error("unexpected"))
        },
      },
      timeoutMs: 20,
      maxConcurrent: 1,
      policy: function cooperativePolicy({ signal }) {
        return new Promise<boolean>((resolve) =>
          signal.addEventListener("abort", () => resolve(false), {
            once: true,
          }),
        )
      },
    })

    await rejects(cooperative.load("host/doc", context()))
    const controller = new AbortController()
    controller.abort()
    await rejects(
      cooperative.load("host/doc", { ...context(), signal: controller.signal }),
      /aborted/,
    )
  })
})
