import { createPostgresCollaborationLog } from "@editor/server/collaboration-postgres"
import { createPostgresEditorCollaborationSessions } from "@editor/server/collaboration-session"
import {
  createPostgresCollaborationTicketStore,
  type EditorCollaborationGrant,
} from "@editor/server/collaboration-tickets"
import { PGlite } from "@electric-sql/pglite"
import { afterEach, expect, test } from "bun:test"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import { readFile } from "node:fs/promises"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"
import { z } from "zod"

const databases: PGlite[] = []

const generation = "a".repeat(64)

class Socket {
  readonly sent: (string | Uint8Array)[] = []
  readonly closed: { code: number; reason: string }[] = []
  bufferedAmount = 0

  send(value: string | Uint8Array) {
    this.sent.push(value)
  }

  close(code = 1000, reason = "closed") {
    this.closed.push({ code, reason })
  }
}

function context() {
  return {
    identity: { provider: "openauth" as const, userId: "alice" },
    credentialExpiresAt: Date.now() + 60000,
    signal: new AbortController().signal,
    deadline: Date.now() + 10000,
  }
}

function grant(permission: "read" | "write"): EditorCollaborationGrant {
  const credentialExpiresAt = Date.now() + 60000

  return {
    documentId: "doc:one",
    generation,
    identity: { provider: "openauth", userId: permission },
    permission,
    credentialExpiresAt,
    expiresAt: Math.min(Date.now() + 10000, credentialExpiresAt),
  }
}

function vectorFrame(doc: Y.Doc) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  sync.writeSyncStep1(encoder, doc)

  return encoding.toUint8Array(encoder)
}

function updateFrame(doc: Y.Doc) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  sync.writeUpdate(encoder, Y.encodeStateAsUpdate(doc))

  return encoding.toUint8Array(encoder)
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}

function applySyncFrame(doc: Y.Doc, frame: Uint8Array) {
  const decoder = decoding.createDecoder(frame)
  expect(decoding.readVarUint(decoder)).toBe(0)
  expect(decoding.readVarUint(decoder)).toBe(sync.messageYjsSyncStep2)
  Y.applyUpdate(doc, decoding.readVarUint8Array(decoder))
}

function delivery(socket: Socket, start: number) {
  for (const value of socket.sent.slice(start)) {
    const text = z.string().safeParse(value)

    if (!text.success) continue
    const parsed: unknown = JSON.parse(text.data)

    const result = z
      .strictObject({ delivery: z.string().regex(/^[0-9a-f]{32}$/) })
      .safeParse(parsed)

    if (result.success) return result.data.delivery
  }

  return null
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
  await db.exec(
    await readFile(
      new URL(
        "../../packages/editor/src/server/collaboration/0003-collaboration-runtime.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  await db.query(
    "INSERT INTO editor_documents VALUES($1,$2,1,'snapshot',$3,1,0,$4)",
    [
      "doc:one",
      generation,
      '{"root":{"type":"root","children":[]}}',
      "b".repeat(64),
    ],
  )
  await db.query("INSERT INTO editor_generations VALUES($1,$2)", [
    generation,
    "doc:one",
  ])

  const transactions = {
    async run<T>(
      signal: AbortSignal,
      deadline: number,
      work: (
        query: (
          text: string,
          values: (string | Uint8Array)[],
        ) => Promise<unknown[]>,
      ) => Promise<T>,
    ) {
      return await db.transaction(async (tx) => {
        const result = await work(async (text, values) => {
          signal.throwIfAborted()

          if (Date.now() >= deadline) throw new Error("deadline")

          return (await tx.query(text, values)).rows
        })

        signal.throwIfAborted()

        if (Date.now() >= deadline) throw new Error("deadline")

        return result
      })
    },
  }

  const log = createPostgresCollaborationLog({
    transactions,
    timeoutMs: 1000,
    maxConcurrent: 8,
    policy: function allowAccess() {
      return Promise.resolve(true)
    },
  })

  const seed = new Y.Doc()
  seed.getText("content").insert(0, "saved")
  await log.initialize(
    {
      documentId: "doc:one",
      generation,
      revision: "1",
      initialize() {
        return Promise.resolve(Y.encodeStateAsUpdate(seed))
      },
    },
    context(),
  )
  seed.destroy()

  const tickets = createPostgresCollaborationTicketStore({
    transactions,
    timeoutMs: 1000,
  })

  const sessionOptions = {
    log,
    tickets,
    transactions,
    timeoutMs: 1000,
    pollIntervalMs: 25,
    revalidate() {
      return Promise.resolve(true)
    },
  }

  return {
    db,
    log,
    createSessions() {
      return createPostgresEditorCollaborationSessions(sessionOptions)
    },
  }
}

afterEach(async function closeDatabases() {
  for (const db of databases.splice(0)) await db.close()
})

test("portable sessions persist writes before delivery and poll updates across runtime instances", async () => {
  const f = await fixture()
  const writerSessions = f.createSessions()
  const readerSessions = f.createSessions()
  const writer = new Socket()
  const reader = new Socket()
  await writerSessions.open(grant("write"), writer)
  await readerSessions.open(grant("read"), reader)
  const writerReady: unknown = JSON.parse(String(writer.sent[0]))
  const readerReady: unknown = JSON.parse(String(reader.sent[0]))

  const writerId = z
    .object({ clientId: z.number().int() })
    .parse(writerReady).clientId

  const readerId = z
    .object({ clientId: z.number().int() })
    .parse(readerReady).clientId

  expect(writerId).not.toBe(readerId)
  const writerDoc = new Y.Doc()
  writerDoc.clientID = writerId
  const readerDoc = new Y.Doc()
  readerDoc.clientID = readerId
  const writerStart = writer.sent.length
  const readerStart = reader.sent.length
  await writerSessions.message(writer, vectorFrame(writerDoc))
  await readerSessions.message(reader, vectorFrame(readerDoc))

  const writerInitial = writer.sent.find(
    (value, index) => index >= writerStart && value instanceof Uint8Array,
  )

  const readerInitial = reader.sent.find(
    (value, index) => index >= readerStart && value instanceof Uint8Array,
  )

  if (!(writerInitial instanceof Uint8Array))
    throw new Error("writer sync missing")

  if (!(readerInitial instanceof Uint8Array))
    throw new Error("reader sync missing")
  applySyncFrame(writerDoc, writerInitial)
  applySyncFrame(readerDoc, readerInitial)
  const writerAck = delivery(writer, writerStart)
  const readerAck = delivery(reader, readerStart)

  if (!writerAck || !readerAck) throw new Error("initial delivery missing")
  await writerSessions.message(writer, JSON.stringify({ ack: writerAck }))
  await readerSessions.message(reader, JSON.stringify({ ack: readerAck }))
  writerDoc.getText("content").insert(5, " shared")
  const revisionBefore = (await f.log.load("doc:one", context())).revision
  await writerSessions.message(writer, updateFrame(writerDoc))
  expect((await f.log.load("doc:one", context())).revision).not.toBe(
    revisionBefore,
  )

  for (let index = 0; index < 20; index++) {
    if (
      reader.sent.some(
        (value, position) =>
          position >= readerStart + 2 && value instanceof Uint8Array,
      )
    )
      break
    await wait(25)
  }

  const remote = reader.sent.find(
    (value, index) => index >= readerStart + 2 && value instanceof Uint8Array,
  )

  if (!(remote instanceof Uint8Array)) throw new Error("polled update missing")
  const decoder = decoding.createDecoder(remote)
  expect(decoding.readVarUint(decoder)).toBe(0)
  expect(decoding.readVarUint(decoder)).toBe(sync.messageYjsSyncStep2)
  Y.applyUpdate(readerDoc, decoding.readVarUint8Array(decoder))
  expect(readerDoc.getText("content").toJSON()).toBe("saved shared")
  await readerSessions.message(reader, updateFrame(readerDoc))
  expect(reader.closed.some((value) => value.code === 1008)).toBe(true)
  await writerSessions.close(writer)
  await readerSessions.close(reader)
  writerDoc.destroy()
  readerDoc.destroy()
})
