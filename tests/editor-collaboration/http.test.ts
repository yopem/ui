import type { EditorCollaborationGrant } from "@editor/server/collaboration-tickets"

import {
  createEditorCollaborationHttpHandler,
  type EditorCollaborationSocket,
  type EditorCollaborationSocketCallbacks,
} from "@editor/server/collaboration-http"
import { expect, test } from "bun:test"
import * as Y from "yjs"
import { z } from "zod"

const generation = "a".repeat(64)

function ticketStore() {
  const values = new Map<string, EditorCollaborationGrant>()
  let next = 1

  return {
    values,
    issue(value: Parameters<typeof values.set>[1]) {
      const token = String(next++).padStart(64, "0")
      values.set(token, value)

      return Promise.resolve(token)
    },
    consume(token: string) {
      const value = values.get(token) ?? null
      values.delete(token)

      return Promise.resolve(value)
    },
  }
}

function socket() {
  const sent: (Uint8Array | string)[] = []

  const value: EditorCollaborationSocket = {
    send(message) {
      sent.push(message)
    },
    close() {
      return undefined
    },
    get bufferedAmount() {
      return 0
    },
  }

  return { value, sent }
}

function fixture(options: { expires?: number; csrf?: string } = {}) {
  const store = ticketStore()
  const doc = new Y.Doc()
  const state = Y.encodeStateAsUpdate(doc)
  doc.destroy()
  let consumed = 0
  let callbacks: EditorCollaborationSocketCallbacks | undefined
  const opened: string[] = []

  const handler = createEditorCollaborationHttpHandler({
    origin: "https://editor.test",
    basePath: "/collaboration/",
    timeoutMs: 1000,
    transactions: {
      async run(_signal, _deadline, work) {
        return await work(() =>
          Promise.resolve([
            {
              document_id: "doc:one",
              generation,
              revision: "2",
              mode: "yjs",
              schema_version: 1,
              deleted: 0,
            },
          ]),
        )
      },
    },
    log: {
      initialize() {
        throw new Error("unexpected initialization")
      },
      load() {
        return Promise.resolve({ generation, revision: "2", state })
      },
      append() {
        throw new Error("unexpected append")
      },
      poll() {
        return Promise.resolve([])
      },
    },
    tickets: {
      reserveClient() {
        return Promise.reject(new Error("unexpected client reservation"))
      },
      renewClient() {
        return Promise.reject(new Error("unexpected client renewal"))
      },
      releaseClient() {
        return Promise.reject(new Error("unexpected client release"))
      },
      async issue(value) {
        return await store.issue(value)
      },
      async consume(token) {
        consumed++

        return await store.consume(token)
      },
    },
    authenticate() {
      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "alice" },
        credentialExpiresAt: options.expires ?? Date.now() + 60000,
      })
    },
    policy() {
      return Promise.resolve(true)
    },
    verifyCsrf({ token }) {
      return Promise.resolve(token === (options.csrf ?? "fixture-csrf"))
    },
    revalidate() {
      return Promise.resolve(true)
    },
    initialize() {
      throw new Error("unexpected initialization")
    },
    sessions: {
      open(grant) {
        opened.push(`${grant.documentId}:${grant.permission}`)

        return Promise.resolve()
      },
      message() {
        return Promise.resolve()
      },
      close() {
        return Promise.resolve()
      },
      error() {
        return Promise.resolve()
      },
    },
    upgrade(_request, protocol, next) {
      if (protocol !== "editor-v1") return false
      callbacks = next

      return true
    },
  })

  return {
    handler,
    opened,
    callbacks() {
      if (!callbacks) throw new Error("upgrade callbacks missing")

      return callbacks
    },
    consumed() {
      return consumed
    },
    tickets: store.values,
  }
}

function ticketRequest(headers: Record<string, string> = {}) {
  return new Request("https://editor.test/collaboration/doc:one/ticket", {
    method: "POST",
    headers: {
      Origin: "https://editor.test",
      "X-CSRF-Token": "fixture-csrf",
      "X-Editor-Permission": "write",
      ...headers,
    },
  })
}

test("ticket route enforces Origin, CSRF, empty body, authentication expiry, and permission", async () => {
  const f = fixture()
  expect(
    (await f.handler.fetch(ticketRequest({ Origin: "https://evil.test" })))
      ?.status,
  ).toBe(403)
  expect(
    (await f.handler.fetch(ticketRequest({ "X-CSRF-Token": "wrong" })))?.status,
  ).toBe(403)
  expect(
    (
      await f.handler.fetch(
        new Request("https://editor.test/collaboration/doc:one/ticket", {
          method: "POST",
          headers: {
            Origin: "https://editor.test",
            "X-CSRF-Token": "fixture-csrf",
            "X-Editor-Permission": "write",
          },
          body: "unexpected",
        }),
      )
    )?.status,
  ).toBe(400)
  const expired = fixture({ expires: Date.now() - 1 })
  expect((await expired.handler.fetch(ticketRequest()))?.status).toBe(401)
  expect(f.tickets.size).toBe(0)
})

test("ticket stays in WebSocket subprotocol, is consumed once, and binds requested document", async () => {
  const f = fixture()
  const issued = await f.handler.fetch(ticketRequest())
  expect(issued?.status).toBe(200)
  const body: unknown = await issued?.json()

  const payload = z
    .strictObject({
      ticket: z.string().regex(/^[0-9a-f]{64}$/),
      protocol: z.literal("editor-v1"),
      expiresAt: z.number().int(),
    })
    .parse(body)

  expect(payload.protocol).toBe("editor-v1")

  const queryTicket = await f.handler.fetch(
    new Request(
      `https://editor.test/collaboration/doc:one/socket?ticket=${payload.ticket}`,
      {
        headers: {
          Origin: "https://editor.test",
          Upgrade: "websocket",
          "Sec-WebSocket-Protocol": "editor-v1",
        },
      },
    ),
  )

  expect(queryTicket?.status).toBe(403)
  expect(f.consumed()).toBe(0)

  const upgrade = await f.handler.fetch(
    new Request("https://editor.test/collaboration/doc:one/socket", {
      headers: {
        Origin: "https://editor.test",
        Upgrade: "websocket",
        Connection: "Upgrade",
        "Sec-WebSocket-Protocol": `editor-v1, ${payload.ticket}`,
      },
    }),
  )

  expect(upgrade).toBeUndefined()
  expect(f.consumed()).toBe(1)

  const replay = await f.handler.fetch(
    new Request("https://editor.test/collaboration/doc:one/socket", {
      headers: {
        Origin: "https://editor.test",
        Upgrade: "websocket",
        Connection: "Upgrade",
        "Sec-WebSocket-Protocol": `editor-v1, ${payload.ticket}`,
      },
    }),
  )

  expect(replay?.status).toBe(401)
  expect(f.consumed()).toBe(2)
  const client = socket()
  await f.callbacks().open(client.value)
  expect(f.opened).toEqual(["doc:one:write"])
  await f.callbacks().close(client.value)
})
