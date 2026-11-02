import { build } from "esbuild"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import { Miniflare } from "miniflare"
import assert from "node:assert/strict"
import { readFile, mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  after as afterAll,
  afterEach,
  before as beforeAll,
  test,
} from "node:test"
import { applyAwarenessUpdate, Awareness } from "y-protocols/awareness"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"
import { z } from "zod"

const root = resolve(import.meta.dirname, "../..")

const origin = "https://editor.test"

const persist = resolve(root, ".do-proof", crypto.randomUUID())

let mf: Miniflare

let db: Awaited<ReturnType<Miniflare["getD1Database"]>>

let script: string

const sockets = new Set<Socket>()

function runtime(revalidateMs = 10000, timeoutMs = 30000) {
  return new Miniflare({
    resourcePersistencePath: persist,
    unsafeInspectDurableObjects: true,
    workers: [
      {
        config: {
          name: "collaboration-fixture",
          domains: ["editor.test"],
          triggers: [{ type: "fetch", pattern: "editor.test/*" }],
          compatibilityDate: "2026-09-01",
          manifest: {
            mainModule: "worker.js",
            modules: { "worker.js": { type: "esm", contents: script } },
          },
          exports: { Room: { type: "durable-object", storage: "sqlite" } },
          env: {
            REVALIDATE_MS: { type: "json", value: revalidateMs },
            TIMEOUT_MS: { type: "json", value: timeoutMs },
            DB: { type: "d1", id: "fixture-db" },
            ROOMS: {
              type: "durable-object",
              worker: "collaboration-fixture",
              exportName: "Room",
            },
          },
        },
      },
    ],
  })
}

beforeAll(
  async () => {
    await mkdir(persist, { recursive: true })

    const result = await build({
      entryPoints: [resolve(import.meta.dirname, "do.fixture.ts")],
      bundle: true,
      tsconfig: resolve(import.meta.dirname, "tsconfig.worker.json"),
      format: "esm",
      platform: "browser",
      external: ["cloudflare:workers"],
      write: false,
    })

    script = result.outputFiles[0]?.text ?? ""
    assert.ok(script.length > 0)
    await writeFile(resolve(persist, "worker.mjs"), script)
    console.info(
      JSON.stringify({
        proof: persist,
        compatibilityDate: "2026-09-01",
        flags: [],
      }),
    )
    mf = runtime()
    db = await mf.getD1Database("DB")

    const migration = await readFile(
      resolve(
        root,
        "packages/editor/src/server/migrations/d1/0001-document-snapshots.sql",
      ),
      "utf8",
    )

    const collaboration = await readFile(
      resolve(
        root,
        "packages/editor/src/server/collaboration/0003-do-canonical.sql",
      ),
      "utf8",
    )

    await db.exec(migration.replaceAll("\n", " "))
    await db.exec(collaboration.replaceAll("\n", " "))
    await db.exec(
      "CREATE TABLE fixture_users(id TEXT PRIMARY KEY, role TEXT); CREATE TABLE fixture_permissions(document_id TEXT,user_id TEXT,permission TEXT,PRIMARY KEY(document_id,user_id)); CREATE TABLE fixture_sessions(token TEXT PRIMARY KEY, user_id TEXT, expires INTEGER); CREATE TABLE fixture_faults(document_id TEXT,phase TEXT,action TEXT,PRIMARY KEY(document_id,phase)); CREATE TABLE fixture_events(name TEXT)",
    )
  },
  { timeout: 60000 },
)

afterAll(async () => {
  await mf?.dispose()
})

afterEach(() => {
  for (const socket of sockets) if (socket.readyState === 1) socket.close(1000)
  sockets.clear()
})

async function setup(id = `doc:${crypto.randomUUID()}`) {
  const writer = crypto.randomUUID()
  const reader = crypto.randomUUID()

  const generation = (crypto.randomUUID() + crypto.randomUUID()).replaceAll(
    "-",
    "",
  )

  await db
    .prepare("INSERT INTO editor_documents VALUES(?,?,1,'snapshot',?,1,0,?)")
    .bind(
      id,
      generation,
      JSON.stringify({
        root: { type: "root", children: [] },
        fixtureText: "saved",
      }),
      "b".repeat(64),
    )
    .run()
  await db
    .prepare("INSERT INTO editor_generations VALUES(?,?)")
    .bind(generation, id)
    .run()

  for (const [token, permission] of [
    [writer, "write"],
    [reader, "read"],
  ]) {
    await db
      .prepare("INSERT INTO fixture_users VALUES(?,?)")
      .bind(token, "user")
      .run()
    await db
      .prepare("INSERT INTO fixture_permissions VALUES(?,?,?)")
      .bind(id, token, permission)
      .run()
    await db
      .prepare("INSERT INTO fixture_sessions VALUES(?,?,?)")
      .bind(token, token, Date.now() + 3600000)
      .run()
  }

  return { id, writer, reader }
}

async function issue(
  id: string,
  token: string,
  permission = "write",
  headers: Record<string, string> = {},
) {
  const response = await mf.dispatchFetch(
    `${origin}/collaboration/${id}/ticket`,
    {
      method: "POST",
      headers: {
        Origin: origin,
        Authorization: token,
        "X-CSRF-Token": "fixture-csrf",
        "X-Editor-Permission": permission,
        ...headers,
      },
    },
  )

  const bytes = await response.arrayBuffer()

  return new Response(bytes, {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  })
}

async function ticket(id: string, token: string, permission = "write") {
  const response = await issue(id, token, permission)
  const payload: unknown = await response.json()
  assert.equal(response.status, 200, JSON.stringify(payload))

  return z.object({ ticket: z.string().regex(/^[0-9a-f]{64}$/) }).parse(payload)
    .ticket
}

async function upgrade(
  id: string,
  opaque: string,
  headers: Record<string, string> = {},
) {
  const response = await mf.dispatchFetch(
    `${origin}/collaboration/${id}/socket`,
    {
      headers: {
        Upgrade: "websocket",
        Origin: origin,
        "Sec-WebSocket-Protocol": `editor-v1, ${opaque}`,
        ...headers,
      },
    },
  )

  if (response.status !== 101) await response.arrayBuffer()

  return response
}

type Socket = NonNullable<Awaited<ReturnType<typeof upgrade>>["webSocket"]>

function inbox(socket: Socket) {
  const events: (string | ArrayBuffer)[] = []
  let wake: (() => void) | undefined
  let failure: Error | undefined
  socket.addEventListener("close", (event) => {
    failure = new Error(`socket closed ${event.code}`)
    wake?.()
  })
  socket.addEventListener("message", (event) => {
    const value = z
      .union([z.string(), z.instanceof(ArrayBuffer)])
      .parse(event.data)

    events.push(value)
    wake?.()
  })
  socket.accept()

  return {
    async next() {
      const deadline = Date.now() + 40000

      while (!events.length) {
        if (failure) throw failure
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("message deadline")),
            Math.max(1, deadline - Date.now()),
          )

          wake = () => {
            clearTimeout(timer)
            resolve()
          }
        })
      }

      return events.shift()
    },
    events,
  }
}

async function join(
  id: string,
  token: string,
  permission = "write",
  headers: Record<string, string> = {},
) {
  const opaque = await ticket(id, token, permission)
  const response = await upgrade(id, opaque, headers)
  assert.equal(response.status, 101)
  assert.equal(response.headers.get("Sec-WebSocket-Protocol"), "editor-v1")

  if (!response.webSocket) throw new Error("socket missing")
  const socket = response.webSocket
  const messages = inbox(socket)
  const ready = z.string().parse(await messages.next())

  const parsed = z
    .object({ clientId: z.number().int() })
    .parse(JSON.parse(ready))

  sockets.add(socket)

  return { socket, messages, clientId: parsed.clientId }
}

function frame(doc: Y.Doc, kind: "vector" | "update") {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)

  if (kind === "vector") sync.writeSyncStep1(encoder, doc)
  else sync.writeUpdate(encoder, Y.encodeStateAsUpdate(doc))

  return encoding.toUint8Array(encoder)
}

async function receive(client: Awaited<ReturnType<typeof join>>) {
  const binary = await client.messages.next()
  assert.equal(binary instanceof ArrayBuffer, true)

  if (!(binary instanceof ArrayBuffer)) throw new Error("binary missing")
  const ack = z.string().parse(await client.messages.next())
  const parsed = z.object({ delivery: z.string() }).parse(JSON.parse(ack))

  if (client.socket.readyState !== 1)
    throw new Error(`socket closed ${client.socket.readyState}`)
  client.socket.send(JSON.stringify({ ack: parsed.delivery }))
  const acknowledged = z.string().parse(await client.messages.next())
  assert.equal(
    z.object({ acked: z.string() }).parse(JSON.parse(acknowledged)).acked,
    parsed.delivery,
  )

  return new Uint8Array(binary)
}

function apply(doc: Y.Doc, bytes: Uint8Array) {
  const decoder = decoding.createDecoder(bytes)
  assert.equal(decoding.readVarUint(decoder), 0)
  assert.equal(decoding.readVarUint(decoder), sync.messageYjsSyncStep2)
  Y.applyUpdate(doc, decoding.readVarUint8Array(decoder))
}

function closed(socket: Socket) {
  return new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("close deadline")), 80000)
    socket.addEventListener(
      "close",
      (event) => {
        clearTimeout(timer)
        resolve(event.code)
      },
      { once: true },
    )
  })
}

void test(
  "tickets enforce Origin, CSRF, policy, one-use and verified expiry",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    assert.equal(
      (await issue(id, writer, "write", { Origin: "https://evil.test" }))
        .status,
      403,
    )
    assert.equal(
      (await issue(id, writer, "write", { "X-CSRF-Token": "wrong" })).status,
      403,
    )
    assert.equal((await issue(id, reader)).status, 403)
    const opaque = await ticket(id, writer)
    assert.equal(
      (await upgrade(id, opaque, { Origin: "https://evil.test" })).status,
      403,
    )
    const first = await upgrade(id, opaque)
    assert.equal(first.status, 101)
    first.webSocket?.accept()
    assert.equal((await upgrade(id, opaque)).status, 401)
    first.webSocket?.close(1000)
    await db
      .prepare("UPDATE fixture_sessions SET expires=? WHERE token=?")
      .bind(Date.now() - 1, writer)
      .run()
    assert.equal((await issue(id, writer)).status, 401)
  },
)

void test(
  "two real clients sync/write, readers never receive SyncStep1 or write",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const left = await join(id, writer)
    const right = await join(id, reader, "read")
    assert.notEqual(left.clientId, right.clientId)
    const doc = new Y.Doc()
    doc.clientID = left.clientId
    left.socket.send(frame(doc, "vector"))
    apply(doc, await receive(left))
    assert.equal(doc.getText("text").toJSON(), "saved")
    doc.getText("text").insert(5, " live")
    left.socket.send(frame(doc, "update"))
    const observer = new Y.Doc()
    apply(observer, await receive(right))
    assert.equal(observer.getText("text").toJSON(), "saved live")
    await receive(left)
    const close = closed(right.socket)
    right.socket.send(frame(observer, "update"))
    assert.equal(await close, 1008)
    left.socket.close(1000)
    doc.destroy()
    observer.destroy()
  },
)

void test(
  "recipient revocation closes before document delivery",
  { timeout: 180000 },
  async (context) => {
    const started = Date.now()
    const { id, writer, reader } = await setup()
    context.diagnostic(`setup ${Date.now() - started}ms`)
    const left = await join(id, writer)
    context.diagnostic(`writer ready ${Date.now() - started}ms`)
    const right = await join(id, reader, "read")
    context.diagnostic(
      `reader ready ${Date.now() - started}ms; state ${right.socket.readyState}`,
    )
    const close = closed(right.socket)
    await db
      .prepare(
        "UPDATE fixture_permissions SET permission='none' WHERE document_id=? AND user_id=?",
      )
      .bind(id, reader)
      .run()
    context.diagnostic(`revoked ${Date.now() - started}ms`)
    const doc = new Y.Doc()
    doc.clientID = left.clientId
    doc.getText("text").insert(0, "accepted")
    left.socket.send(frame(doc, "update"))

    const [code] = await Promise.all([
      close.then((code) => {
        context.diagnostic(`recipient closed ${Date.now() - started}ms`)

        return code
      }),
      receive(left).then((bytes) => {
        context.diagnostic(`writer receipt ${Date.now() - started}ms`)

        return bytes
      }),
    ])

    assert.equal(code, 1008)
    assert.equal(
      right.messages.events.filter((event) => event instanceof ArrayBuffer)
        .length,
      0,
    )
    assert.equal(left.socket.readyState, 1)
    left.socket.close(1000)
    doc.destroy()
  },
)

void test(
  "actual hibernating eviction restores ownership and state; restart retains document",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    const client = await join(id, writer)
    await mf.unsafeEvictDurableObject("collaboration-fixture", "Room", {
      name: id,
      webSockets: "hibernate",
    })
    const doc = new Y.Doc()
    client.socket.send(frame(doc, "vector"))
    apply(doc, await receive(client))
    assert.equal(doc.getText("text").toJSON(), "saved")
    client.socket.close(1000)
    await mf.dispose()
    mf = runtime()
    db = await mf.getD1Database("DB")
    const resumed = await join(id, writer)
    const loaded = new Y.Doc()
    resumed.socket.send(frame(loaded, "vector"))
    apply(loaded, await receive(resumed))
    assert.equal(loaded.getText("text").toJSON(), "saved")
    resumed.socket.close(1000)
    doc.destroy()
    loaded.destroy()
  },
)

void test(
  "malformed, oversized and declared expensive frames close without mutation",
  { timeout: 180000 },
  async () => {
    for (const payload of [
      new Uint8Array([0, 2, 5, 1, 255, 255, 255, 127]),
      new Uint8Array(65537),
      new Uint8Array([0, 2, 4, 1, 255, 255, 127]),
    ]) {
      const { id, writer } = await setup()
      const client = await join(id, writer)
      const close = closed(client.socket)
      client.socket.send(payload)
      assert.equal(await close, 1008)
    }
  },
)

void test(
  "duplicate snapshots never reach an initializer that ignores input, including on retry",
  { timeout: 180000 },
  async () => {
    for (const raw of [
      '{"root":{"type":"root","children":[],"meta":{"x":1,"x":2}},"fixtureText":"saved"}',
      '{"root":{"type":"root","children":[],"meta":{"x":1,"\\u0078":2}},"fixtureText":"saved"}',
      '{"root":null,"root":{"type":"root","children":[]},"fixtureText":"saved"}',
    ]) {
      const { id, writer, reader } = await setup()
      await db
        .prepare("UPDATE editor_documents SET state_json=? WHERE document_id=?")
        .bind(raw, id)
        .run()
      await fault(id, "ignore-snapshot", "ignore")

      const before = await db
        .prepare("SELECT * FROM editor_documents WHERE document_id=?")
        .bind(id)
        .first()

      assert.equal((await issue(id, reader)).status, 403)

      for (let attempt = 0; attempt < 2; attempt++) {
        assert.equal((await issue(id, writer)).status, 503)
        assert.deepEqual(
          await db
            .prepare("SELECT * FROM editor_documents WHERE document_id=?")
            .bind(id)
            .first(),
          before,
        )
        assert.equal(
          (
            await db
              .prepare(
                "SELECT count(*) AS count FROM fixture_faults WHERE document_id=? AND phase='ignore-snapshot'",
              )
              .bind(id)
              .first<{ count: number }>()
          )?.count,
          1,
        )
        assert.equal(
          (
            await db
              .prepare(
                "SELECT count(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
              )
              .bind(id)
              .first<{ count: number }>()
          )?.count,
          0,
        )

        const storage = await mf.unsafeGetDurableObjectStorage(
          "collaboration-fixture",
          "Room",
          { name: id },
        )

        assert.equal(
          (
            await storage.exec<{ count: number }>(
              "SELECT count(*) AS count FROM collaboration_head",
            )
          )[0]?.count,
          0,
        )
      }

      const valid =
        '{"root":{"type":"root","children":[],"meta":{"x":1}},"fixtureText":"saved","other":{"x":2}}'

      await db
        .prepare("UPDATE editor_documents SET state_json=? WHERE document_id=?")
        .bind(valid, id)
        .run()
      assert.equal(
        (await issue(id, writer, "write", { "X-Fixture-Aborted-Request": "1" }))
          .status,
        503,
      )
      assert.equal(
        (
          await db
            .prepare(
              "SELECT count(*) AS count FROM fixture_faults WHERE document_id=? AND phase='ignore-snapshot'",
            )
            .bind(id)
            .first<{ count: number }>()
        )?.count,
        1,
      )
      assert.equal((await issue(id, writer)).status, 200)
      assert.equal(
        (
          await db
            .prepare(
              "SELECT state_json FROM editor_documents WHERE document_id=?",
            )
            .bind(id)
            .first<{ state_json: string }>()
        )?.state_json,
        valid,
      )
      assert.equal(
        (
          await db
            .prepare(
              "SELECT count(*) AS count FROM fixture_faults WHERE document_id=? AND phase='ignore-snapshot'",
            )
            .bind(id)
            .first<{ count: number }>()
        )?.count,
        0,
      )
    }
  },
)

void test(
  "canonical bootstrap fences snapshot mutation and missing active state",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    const client = await join(id, writer)
    assert.equal(
      (
        await db
          .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
          .bind(id)
          .first<{ mode: string }>()
      )?.mode,
      "yjs",
    )
    await assert.rejects(
      db
        .prepare(
          "UPDATE editor_documents SET deleted=1, state_json=NULL WHERE document_id=?",
        )
        .bind(id)
        .run(),
    )
    client.socket.close(1000)

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    await storage.exec("DELETE FROM collaboration_head")
    await mf.unsafeEvictDurableObject("collaboration-fixture", "Room", {
      name: id,
      webSockets: "close",
    })
    assert.equal((await issue(id, writer)).status, 503)
  },
)

void test(
  "DO storage failure prevents broadcast and slow delivery closes instead of queue growth",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const client = await join(id, writer)
    const peer = await join(id, reader, "read")

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    await storage.exec(
      "CREATE TRIGGER fail_write BEFORE UPDATE ON collaboration_head BEGIN SELECT RAISE(ABORT, 'fixture storage failure'); END",
    )
    const doc = new Y.Doc()
    doc.clientID = client.clientId
    doc.getText("text").insert(0, "not-broadcast")
    const close = closed(client.socket)
    client.socket.send(frame(doc, "update"))
    assert.equal(await close, 1011)
    assert.equal(
      peer.messages.events.filter((event) => event instanceof ArrayBuffer)
        .length,
      0,
    )
    peer.socket.close(1000)
    doc.destroy()
  },
)

async function fault(id: string, phase: string, action: string) {
  await db
    .prepare("INSERT INTO fixture_faults VALUES(?,?,?)")
    .bind(id, phase, action)
    .run()
}

function presence(
  clientId: number,
  clock: number,
  state: {
    user: { id: string }
    cursor: null | { anchor: string; head: string }
  } | null,
) {
  const payload = encoding.createEncoder()
  encoding.writeVarUint(payload, 1)
  encoding.writeVarUint(payload, clientId)
  encoding.writeVarUint(payload, clock)
  encoding.writeVarString(payload, JSON.stringify(state))
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint8Array(encoder, encoding.toUint8Array(payload))

  return encoding.toUint8Array(encoder)
}

function readPresence(bytes: Uint8Array) {
  const outer = decoding.createDecoder(bytes)
  assert.equal(decoding.readVarUint(outer), 1)
  const payload = decoding.createDecoder(decoding.readVarUint8Array(outer))
  assert.equal(decoding.readVarUint(payload), 1)
  const clientId = decoding.readVarUint(payload)
  const clock = decoding.readVarUint(payload)

  const state = z
    .object({
      user: z.object({ id: z.string(), name: z.string() }),
      cursor: z.object({ anchor: z.string(), head: z.string() }).nullable(),
    })
    .nullable()
    .parse(JSON.parse(decoding.readVarString(payload)))

  return { clientId, clock, state }
}

void test(
  "awareness rewrites identity, rejects spoof/removal, survives hibernation and removes disconnected owner",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const left = await join(id, writer)
    const right = await join(id, reader, "read")
    left.socket.send(
      presence(left.clientId, 1, {
        user: { id: "spoofed-admin" },
        cursor: null,
      }),
    )
    const value = readPresence(await receive(right))
    assert.equal(value.state?.user.id, writer)
    assert.equal(value.state?.user.name, writer)
    await receive(left)
    await mf.unsafeEvictDurableObject("collaboration-fixture", "Room", {
      name: id,
      webSockets: "hibernate",
    })
    const rejected = closed(right.socket)
    right.socket.send(presence(left.clientId, 2, null))
    assert.equal(await rejected, 1008)
    left.socket.close(1000)
    const peer = await join(id, writer)
    const removed = await join(id, reader, "read")
    peer.socket.send(
      presence(peer.clientId, 1, { user: { id: "wrong" }, cursor: null }),
    )
    await receive(peer)
    await receive(removed)
    peer.socket.close(1000)
    const removal = readPresence(await receive(removed))
    assert.equal(removal.clientId, peer.clientId)
    assert.equal(removal.state, null)
    assert.equal(removal.clock, 2)
    removed.socket.close(1000)
  },
)

void test(
  "reader SyncStep2 and own-clock replay fail closed",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const owner = await join(id, writer)
    const peer = await join(id, reader, "read")
    const step2 = encoding.createEncoder()
    encoding.writeVarUint(step2, 0)
    encoding.writeVarUint(step2, sync.messageYjsSyncStep2)
    encoding.writeVarUint8Array(step2, new Uint8Array([0, 0]))
    const denied = closed(peer.socket)
    peer.socket.send(encoding.toUint8Array(step2))
    assert.equal(await denied, 1008)
    owner.socket.send(presence(owner.clientId, 1, null))
    await receive(owner)
    const replay = closed(owner.socket)
    owner.socket.send(presence(owner.clientId, 1, null))
    assert.equal(await replay, 1008)
  },
)

void test(
  "ticket expiry, idle credential expiry and periodic revocation use bounded alarm",
  { timeout: 240000 },
  async () => {
    const { id, writer, reader } = await setup()
    const expired = await ticket(id, writer)

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    await storage.exec("UPDATE collaboration_tickets SET expires=0")
    assert.equal((await upgrade(id, expired)).status, 401)
    await db
      .prepare("UPDATE fixture_sessions SET expires=? WHERE token=?")
      .bind(Date.now() + 8000, reader)
      .run()
    const idle = await join(id, reader, "read")
    const expiryClose = closed(idle.socket)
    assert.equal(await expiryClose, 1008)
    const revoked = await join(id, writer)
    const revocationClose = closed(revoked.socket)
    await db
      .prepare(
        "UPDATE fixture_permissions SET permission='none' WHERE document_id=? AND user_id=?",
      )
      .bind(id, writer)
      .run()
    assert.equal(await revocationClose, 1008)

    const tickets = await storage.exec<{ count: number }>(
      "SELECT COUNT(*) AS count FROM collaboration_tickets",
    )

    assert.equal(tickets[0]?.count, 0)
  },
)

void test(
  "D1 CAS rejects initialization racing save/delete/new generation without stale seed",
  { timeout: 180000 },
  async () => {
    for (const mutation of ["update", "delete", "generation"]) {
      const { id, writer } = await setup()
      await fault(id, "initialize", mutation)
      assert.equal((await issue(id, writer)).status, 503)

      const seed = await db
        .prepare(
          "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
        )
        .bind(id)
        .first<{ count: number }>()

      assert.equal(seed?.count, 0)

      if (mutation === "delete") {
        assert.equal((await issue(id, writer)).status, 503)
      } else {
        const client = await join(id, writer)
        const doc = new Y.Doc()
        client.socket.send(frame(doc, "vector"))
        apply(doc, await receive(client))
        assert.equal(
          doc.getText("text").toJSON(),
          mutation === "update" ? "new saved" : "new generation",
        )
        client.socket.close(1000)
        doc.destroy()
      }
    }
  },
)

void test(
  "uncertain D1 preparation and activation recover authoritative seed after eviction",
  { timeout: 180000 },
  async () => {
    for (const phase of ["prepared", "activated"]) {
      const { id, writer } = await setup()
      await fault(id, phase, "throw")
      assert.equal((await issue(id, writer)).status, 503)

      const row = await db
        .prepare(
          "SELECT state_json,mode FROM editor_documents WHERE document_id=?",
        )
        .bind(id)
        .first<{ state_json: string; mode: string }>()

      assert.equal(row?.mode, "yjs")
      assert.equal(JSON.parse(row?.state_json ?? "null").fixtureText, "saved")
      await mf.unsafeEvictDurableObject("collaboration-fixture", "Room", {
        name: id,
      })
      const client = await join(id, writer)
      const doc = new Y.Doc()
      client.socket.send(frame(doc, "vector"))
      apply(doc, await receive(client))
      assert.equal(doc.getText("text").toJSON(), "saved")
      client.socket.close(1000)
      doc.destroy()
    }
  },
)

void test(
  "persisted update recovers after actor abort before broadcast",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const client = await join(id, writer)
    const observer = await join(id, reader, "read")
    await fault(id, "committed", "abort")
    const doc = new Y.Doc()
    doc.clientID = client.clientId
    doc.getText("text").insert(0, "durable")
    const lost = closed(client.socket)
    client.socket.send(frame(doc, "update"))
    await lost
    assert.equal(
      observer.messages.events.filter((event) => event instanceof ArrayBuffer)
        .length,
      0,
    )
    const rejoined = await join(id, reader, "read")
    const recovered = new Y.Doc()
    rejoined.socket.send(frame(recovered, "vector"))
    apply(recovered, await receive(rejoined))
    assert.ok(recovered.getText("text").toJSON().includes("durable"))
    rejoined.socket.close(1000)
    doc.destroy()
    recovered.destroy()
  },
)

void test(
  "slow consumers, rate, ticket and lifetime client budgets fail closed",
  { timeout: 300000 },
  async (context) => {
    const { id, writer } = await setup()
    const client = await join(id, writer)
    const doc = new Y.Doc()
    client.socket.send(frame(doc, "vector"))
    await client.messages.next()
    await client.messages.next()
    const slow = closed(client.socket)
    client.socket.send(frame(doc, "vector"))
    client.socket.send(frame(doc, "vector"))
    assert.equal(await slow, 1011)

    await ticket(id, writer)

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    await storage.exec(
      "UPDATE collaboration_tickets SET expires=?",
      Date.now() + 60000,
    )
    await storage.exec(
      "WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<63) INSERT INTO collaboration_tickets SELECT printf('%064x',x),grant_json,expires FROM n CROSS JOIN (SELECT grant_json,expires FROM collaboration_tickets LIMIT 1)",
    )
    assert.equal((await issue(id, writer)).status, 503)

    const count = await storage.exec<{ count: number }>(
      "SELECT COUNT(*) AS count FROM collaboration_tickets",
    )

    assert.equal(count[0]?.count, 64)
    await storage.exec("DELETE FROM collaboration_tickets")
    const rate = await join(id, writer)
    const rateClosed = closed(rate.socket)

    for (let index = 0; index < 40; index++)
      rate.socket.send(frame(doc, "vector"))
    assert.ok([1008, 1011].includes(await rateClosed))
    const exhausted = await setup()
    const initial = await issue(exhausted.id, exhausted.writer)

    if (initial.status === 503) {
      z.object({
        error: z.literal("uncertain"),
        retry: z.literal("fresh-ticket-and-sync"),
      }).parse(await initial.json())

      const durable = await db
        .prepare(
          "SELECT d.mode,d.state_json,d.generation,b.generation AS seed_generation,b.phase FROM editor_documents d JOIN editor_do_bootstrap b ON b.document_id=d.document_id WHERE d.document_id=?",
        )
        .bind(exhausted.id)
        .first<{
          mode: string
          state_json: string
          generation: string
          seed_generation: string
          phase: string
        }>()

      assert.ok(durable)
      assert.equal(durable.mode, "yjs")
      assert.equal(durable.generation, durable.seed_generation)
      assert.ok(durable.phase === "prepared" || durable.phase === "active")
      z.object({ fixtureText: z.literal("saved") }).parse(
        JSON.parse(durable.state_json),
      )
      context.diagnostic(
        "Bootstrap returned uncertain after persistence; verify one explicit fresh-ticket recovery",
      )
    } else assert.equal(initial.status, 200)
    const opaque = await ticket(exhausted.id, exhausted.writer)

    const exhaustedStorage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: exhausted.id },
    )

    await exhaustedStorage.exec(
      "INSERT INTO collaboration_clients VALUES(4294967295)",
    )
    assert.equal((await upgrade(exhausted.id, opaque)).status, 503)
    doc.destroy()
  },
)

void test(
  "read-only reconnects do not exhaust document Yjs client budget",
  { timeout: 900000 },
  async () => {
    const { id, writer, reader } = await setup()
    const first = await join(id, writer)
    first.socket.close(1000)
    const ids = new Set<number>()

    for (let index = 0; index < 34; index++) {
      const client = await join(id, reader, "read")
      assert.equal(ids.has(client.clientId), false)
      ids.add(client.clientId)
      client.socket.close(1000)
    }

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    const count = await storage.exec<{ count: number }>(
      "SELECT COUNT(*) AS count FROM collaboration_clients",
    )

    assert.equal(count[0]?.count, 1)
  },
)

void test(
  "workerd rejects hostile V1 allocation, deep values, missing dependencies and self-parent inputs",
  { timeout: 180000 },
  async () => {
    for (const kind of [
      "allocation",
      "deep",
      "pending",
      "self-parent",
      "subdoc",
    ]) {
      const { id, writer } = await setup()
      const client = await join(id, writer)
      const doc = new Y.Doc()
      doc.clientID = client.clientId
      let update: Uint8Array

      if (kind === "allocation") {
        const encoder = encoding.createEncoder()

        for (const value of [1, 4294967295, client.clientId, 0])
          encoding.writeVarUint(encoder, value)
        update = encoding.toUint8Array(encoder)
      } else if (kind === "self-parent") {
        const encoder = encoding.createEncoder()

        for (const value of [
          1,
          1,
          client.clientId,
          0,
          7,
          0,
          client.clientId,
          0,
          1,
          0,
        ])
          encoding.writeVarUint(encoder, value)
        update = encoding.toUint8Array(encoder)
      } else if (kind === "pending") {
        doc.getText("text").insert(0, "missing")
        const vector = Y.encodeStateVector(doc)
        doc.getText("text").insert(7, "next")
        update = Y.encodeStateAsUpdate(doc, vector)
      } else if (kind === "subdoc") {
        doc.getMap("map").set("subdoc", new Y.Doc())
        update = Y.encodeStateAsUpdate(doc)
      } else {
        type Nested = Nested[] | null

        let nested: Nested = null

        for (let index = 0; index < 100; index++) nested = [nested]
        doc.getMap("map").set("nested", nested)
        update = Y.encodeStateAsUpdate(doc)
      }

      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, 0)
      sync.writeUpdate(encoder, update)
      const closing = closed(client.socket)
      client.socket.send(encoding.toUint8Array(encoder))
      assert.equal(await closing, 1008, kind)

      const storage = await mf.unsafeGetDurableObjectStorage(
        "collaboration-fixture",
        "Room",
        { name: id },
      )

      const head = await storage.exec<{ revision: number }>(
        "SELECT revision FROM collaboration_head",
      )

      assert.equal(head[0]?.revision, 0, kind)
      doc.destroy()
    }
  },
)

void test(
  "host revalidation errors close without leaking document state",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    const client = await join(id, writer)
    await fault(id, "revalidate", "throw")
    const closing = closed(client.socket)
    const doc = new Y.Doc()
    client.socket.send(frame(doc, "vector"))
    assert.equal(await closing, 1011)
    assert.equal(
      client.messages.events.filter((event) => event instanceof ArrayBuffer)
        .length,
      0,
    )
    doc.destroy()
  },
)

void test(
  "D1 coordinator fence rejects accidental routing to another object",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    const client = await join(id, writer)

    const response = await issue(id, writer, "write", {
      "X-Fixture-Room": `other:${crypto.randomUUID()}`,
    })

    assert.equal(response.status, 503)
    client.socket.close(1000)
  },
)

void test(
  "expiry during host initialization prevents canonical mode mutation",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    await fault(id, "initialize", "credential-expiry")
    assert.equal(
      (await issue(id, writer, "write", { "X-Fixture-Short-Credential": "1" }))
        .status,
      403,
    )
    assert.equal(
      (
        await db
          .prepare(
            "SELECT COUNT(*) AS count FROM fixture_faults WHERE document_id=? AND phase='initialize'",
          )
          .bind(id)
          .first<{ count: number }>()
      )?.count,
      0,
    )

    const canonical = await db
      .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
      .bind(id)
      .first<{ mode: string }>()

    assert.equal(canonical?.mode, "snapshot")

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
  },
)

void test(
  "session revocation during initialization prevents canonical mutation",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    await fault(id, "initialize", `revoke:${writer}`)
    assert.equal((await issue(id, writer)).status, 403)

    const canonical = await db
      .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
      .bind(id)
      .first<{ mode: string }>()

    assert.equal(canonical?.mode, "snapshot")

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
  },
)

void test(
  "one queued delivery survives hibernation and is reauthorized before exposure",
  { timeout: 180000 },
  async (context) => {
    await mf.dispose()
    mf = runtime(30000)
    db = await mf.getD1Database("DB")
    context.diagnostic(
      "Queue proof uses configured 30000ms revalidation and ACK lease",
    )
    const { id, writer, reader } = await setup()
    const left = await join(id, writer)
    const right = await join(id, reader, "read")
    const doc = new Y.Doc()
    doc.clientID = left.clientId
    left.socket.send(frame(doc, "vector"))
    apply(doc, await receive(left))
    doc.getText("text").insert(0, "one ")
    left.socket.send(frame(doc, "update"))
    doc.getText("text").insert(0, "two ")
    left.socket.send(frame(doc, "update"))
    await receive(left)
    await mf.unsafeEvictDurableObject("collaboration-fixture", "Room", {
      name: id,
      webSockets: "hibernate",
    })
    await receive(left)
    const first = await receive(right)
    const second = await receive(right)
    const recovered = new Y.Doc()
    apply(recovered, first)
    apply(recovered, second)
    assert.equal(recovered.getText("text").toJSON(), "two one saved")
    doc.getText("text").insert(0, "three ")
    left.socket.send(frame(doc, "update"))
    await receive(left)
    doc.getText("text").insert(0, "four ")
    left.socket.send(frame(doc, "update"))
    await receive(left)
    const closing = closed(right.socket)
    await db
      .prepare(
        "UPDATE fixture_permissions SET permission='none' WHERE document_id=? AND user_id=?",
      )
      .bind(id, reader)
      .run()

    try {
      await receive(right)
    } catch (error) {
      assert.match(String(error), /socket closed/)
    }

    assert.ok([1008, 1011].includes(await closing))
    assert.equal(
      right.messages.events.filter((event) => event instanceof ArrayBuffer)
        .length,
      0,
    )

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    const queued = await storage.exec<{ count: number }>(
      "SELECT COUNT(*) AS count FROM collaboration_outbox",
    )

    assert.ok(queued[0] !== undefined && queued[0].count <= 1)
    left.socket.close(1000)
    doc.destroy()
    recovered.destroy()
  },
)

void test(
  "bounded Unicode presence fits hibernation attachments",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const left = await join(id, writer)
    const right = await join(id, reader, "read")
    const cursor = { anchor: "Ω".repeat(512), head: "Ω".repeat(512) }
    left.socket.send(
      presence(left.clientId, 1, { user: { id: "forged" }, cursor }),
    )
    assert.deepEqual(readPresence(await receive(left)).state?.cursor, cursor)
    assert.deepEqual(readPresence(await receive(right)).state?.cursor, cursor)
    await mf.unsafeEvictDurableObject("collaboration-fixture", "Room", {
      name: id,
      webSockets: "hibernate",
    })
    left.socket.send(presence(left.clientId, 2, null))
    assert.equal(readPresence(await receive(left)).clock, 2)
    assert.equal(readPresence(await receive(right)).state, null)
    left.socket.close(1000)
    right.socket.close(1000)
  },
)

void test(
  "expired recipient receives no document frame when native alarm is delayed",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const left = await join(id, writer)
    await db
      .prepare("UPDATE fixture_sessions SET expires=? WHERE token=?")
      .bind(Date.now() + 15000, reader)
      .run()

    const right = await join(id, reader, "read", {
      "X-Fixture-Delay-Alarm": "1",
    })

    await new Promise((resolve) => setTimeout(resolve, 16000))
    assert.equal(right.socket.readyState, 1)
    const closing = closed(right.socket)
    const doc = new Y.Doc()
    doc.clientID = left.clientId
    doc.getText("text").insert(0, "accepted")
    left.socket.send(frame(doc, "update"))
    const [code] = await Promise.all([closing, receive(left)])
    assert.equal(code, 1008)
    assert.equal(
      right.messages.events.filter((event) => event instanceof ArrayBuffer)
        .length,
      0,
    )
    left.socket.close(1000)
    doc.destroy()
  },
)

void test(
  "workerd accepts near-budget structs and rejects growth before mutation",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    const client = await join(id, writer)
    const doc = new Y.Doc()
    doc.clientID = client.clientId

    for (let index = 0; index < 1900; index++)
      doc.getText("stress").insert(0, "x")
    const accepted = Y.encodeStateAsUpdate(doc)
    assert.equal(Y.decodeUpdate(accepted).structs.length, 1900)
    assert.ok(accepted.byteLength < 61440)
    client.socket.send(frame(doc, "update"))
    const recovered = new Y.Doc()
    apply(recovered, await receive(client))
    assert.equal(recovered.getText("stress").toJSON(), "x".repeat(1900))

    for (let index = 0; index < 200; index++)
      doc.getText("stress").insert(0, "y")
    const rejected = Y.encodeStateAsUpdate(doc)
    assert.ok(Y.decodeUpdate(rejected).structs.length > 2048)
    assert.ok(rejected.byteLength < 61440)
    const closing = closed(client.socket)
    client.socket.send(frame(doc, "update"))
    assert.equal(await closing, 1008)

    const storage = await mf.unsafeGetDurableObjectStorage(
      "collaboration-fixture",
      "Room",
      { name: id },
    )

    const head = await storage.exec<{ revision: number }>(
      "SELECT revision FROM collaboration_head",
    )

    assert.equal(head[0]?.revision, 1)
    doc.destroy()
    recovered.destroy()
  },
)

void test(
  "bounded verified identity is checked before bootstrap effects",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    const userId = "u".repeat(257)
    await db
      .prepare("INSERT INTO fixture_users VALUES(?,'user')")
      .bind(userId)
      .run()
    await db
      .prepare("INSERT INTO fixture_permissions VALUES(?,?,'write')")
      .bind(id, userId)
      .run()
    await db
      .prepare("UPDATE fixture_sessions SET user_id=? WHERE token=?")
      .bind(userId, writer)
      .run()
    assert.equal((await issue(id, writer)).status, 400)

    const canonical = await db
      .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
      .bind(id)
      .first<{ mode: string }>()

    assert.equal(canonical?.mode, "snapshot")

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
  },
)

void test(
  "blocked authentication cannot dispatch policy or bootstrap after absolute deadline",
  { timeout: 180000 },
  async () => {
    await mf.dispose()
    mf = runtime(10000, 1000)
    db = await mf.getD1Database("DB")
    const { id, writer } = await setup()
    assert.equal(
      (
        await issue(id, writer, "write", {
          "X-Fixture-Block-Authentication": "1",
        })
      ).status,
      503,
    )

    const blocked = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM fixture_events WHERE name='authentication-blocked'",
      )
      .first<{ count: number }>()

    assert.equal(blocked?.count, 1)

    const events = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM fixture_events WHERE name='policy-after-deadline'",
      )
      .first<{ count: number }>()

    assert.equal(events?.count, 0)

    const canonical = await db
      .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
      .bind(id)
      .first<{ mode: string }>()

    assert.equal(canonical?.mode, "snapshot")

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
  },
)

void test(
  "aborted native Request cannot start bootstrap effects",
  { timeout: 180000 },
  async () => {
    await mf.dispose()
    mf = runtime()
    db = await mf.getD1Database("DB")
    const { id, writer } = await setup()
    assert.equal(
      (await issue(id, writer, "write", { "X-Fixture-Aborted-Request": "1" }))
        .status,
      503,
    )

    const canonical = await db
      .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
      .bind(id)
      .first<{ mode: string }>()

    assert.equal(canonical?.mode, "snapshot")

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
  },
)

void test(
  "missing canonical snapshot never reaches initializer or creates empty seed",
  { timeout: 180000 },
  async () => {
    const { id, writer } = await setup()
    await fault(id, "read", "null-snapshot")
    await fault(id, "initialize", "throw")
    assert.equal((await issue(id, writer)).status, 503)

    const untouched = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM fixture_faults WHERE document_id=? AND phase='initialize'",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(untouched?.count, 1)

    const canonical = await db
      .prepare(
        "SELECT mode,state_json FROM editor_documents WHERE document_id=?",
      )
      .bind(id)
      .first<{ mode: string; state_json: string }>()

    assert.equal(canonical?.mode, "snapshot")
    assert.ok(canonical?.state_json.includes("saved"))

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
  },
)

void test(
  "malformed JSON receipt controls close as invalid input without mutation",
  { timeout: 180000 },
  async () => {
    for (const message of ["{", "{}", JSON.stringify({ ack: "wrong" })]) {
      const { id, writer } = await setup()
      const client = await join(id, writer)
      const closing = closed(client.socket)
      client.socket.send(message)
      assert.equal(await closing, 1008)

      const storage = await mf.unsafeGetDurableObjectStorage(
        "collaboration-fixture",
        "Room",
        { name: id },
      )

      const head = await storage.exec<{ revision: number }>(
        "SELECT revision FROM collaboration_head",
      )

      assert.equal(head[0]?.revision, 0)
    }
  },
)

void test(
  "maximum awareness clock still removes disconnected owner through real awareness protocol",
  { timeout: 180000 },
  async () => {
    const { id, writer, reader } = await setup()
    const left = await join(id, writer)
    const right = await join(id, reader, "read")
    const doc = new Y.Doc()
    const awareness = new Awareness(doc)
    awareness.setLocalState(null)

    try {
      left.socket.send(
        presence(left.clientId, 4294967295, {
          user: { id: "spoof" },
          cursor: null,
        }),
      )
      const [initial] = await Promise.all([receive(right), receive(left)])
      const initialDecoder = decoding.createDecoder(initial)
      assert.equal(decoding.readVarUint(initialDecoder), 1)
      applyAwarenessUpdate(
        awareness,
        decoding.readVarUint8Array(initialDecoder),
        "server",
      )
      assert.equal(awareness.getStates().has(left.clientId), true)
      left.socket.close(1000)
      const removed = decoding.createDecoder(await receive(right))
      assert.equal(decoding.readVarUint(removed), 1)
      applyAwarenessUpdate(
        awareness,
        decoding.readVarUint8Array(removed),
        "server",
      )
      assert.equal(awareness.getStates().has(left.clientId), false)
      right.socket.close(1000)
    } finally {
      awareness.destroy()
      doc.destroy()
    }
  },
)

void test(
  "verified account and admin role do not grant access to another document",
  { timeout: 180000 },
  async () => {
    const own = await setup()
    const other = await setup()
    await db
      .prepare("UPDATE fixture_users SET role='admin' WHERE id=?")
      .bind(own.writer)
      .run()
    assert.equal((await issue(other.id, own.writer, "write")).status, 403)
    assert.equal((await issue(other.id, own.writer, "read")).status, 403)

    const untouched = await db
      .prepare("SELECT mode FROM editor_documents WHERE document_id=?")
      .bind(other.id)
      .first<{ mode: string }>()

    assert.equal(untouched?.mode, "snapshot")

    const seeds = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM editor_do_bootstrap WHERE document_id=?",
      )
      .bind(other.id)
      .first<{ count: number }>()

    assert.equal(seeds?.count, 0)
    assert.equal((await issue(own.id, own.writer, "write")).status, 200)
  },
)

void test(
  "stalled ticket body releases serialized admission after deadline",
  { timeout: 180000 },
  async () => {
    await mf.dispose()
    mf = runtime(10000, 15000)
    db = await mf.getD1Database("DB")
    const { id, writer } = await setup()
    assert.equal(
      (await issue(id, writer, "write", { "X-Fixture-Stalled-Body": "1" }))
        .status,
      503,
    )
    assert.equal((await issue(id, writer)).status, 200)
  },
)
