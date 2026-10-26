import {
  EditorCollaborationProvider,
  type EditorCollaborationWebSocket,
} from "@editor/collaboration"
import { describe, expect, test } from "bun:test"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"
import { z } from "zod"

class Socket extends EventTarget implements EditorCollaborationWebSocket {
  readyState = 0
  bufferedAmount = 0
  binaryType: BinaryType = "arraybuffer"
  readonly sent: (string | Uint8Array)[] = []

  send(data: string | ArrayBuffer | ArrayBufferView) {
    if (data instanceof ArrayBuffer) this.sent.push(new Uint8Array(data))
    else if (ArrayBuffer.isView(data))
      this.sent.push(
        new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
      )
    else this.sent.push(data)
  }

  open() {
    this.readyState = 1
    this.dispatchEvent(new Event("open"))
  }

  message(data: string | ArrayBuffer | Uint8Array | DataView | Blob | number) {
    this.dispatchEvent(new MessageEvent("message", { data }))
  }

  close(code = 1000, reason = "closed") {
    this.readyState = 3
    this.dispatchEvent(new CloseEvent("close", { code, reason }))
  }
}

function syncStep2(doc: Y.Doc) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  sync.writeSyncStep2(encoder, doc, new Uint8Array([0]))

  return encoding.toUint8Array(encoder)
}

async function settle() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

function makeProvider(permission: "read" | "write" = "write") {
  const sockets: Socket[] = []
  let tickets = 0

  const provider = new EditorCollaborationProvider({
    documentId: "doc:one",
    permission,
    ticketUrl: "https://editor.test/collaboration/doc:one/ticket",
    socketUrl: "wss://editor.test/collaboration/doc:one/socket",
    headers() {
      return { Authorization: "host-session", "X-CSRF-Token": "csrf" }
    },
    fetcher(input, init) {
      tickets++
      const url = input instanceof Request ? input.url : input.toString()
      expect(new URL(url).search).toBe("")
      expect(new URL(url).hash).toBe("")
      expect(init?.method).toBe("POST")
      expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("csrf")

      return Promise.resolve(
        Response.json({
          ticket: String(tickets).padStart(64, "0"),
          expiresAt: Date.now() + 10000,
          protocol: "editor-v1",
        }),
      )
    },
    webSocketFactory(url, protocols) {
      expect(new URL(url).search).toBe("")
      expect(protocols).toEqual([
        "editor-v1",
        String(tickets).padStart(64, "0"),
      ])
      const socket = new Socket()
      sockets.push(socket)

      return socket
    },
  })

  return { provider, sockets, tickets: () => tickets }
}

async function ready(
  provider: EditorCollaborationProvider,
  socket: Socket,
  clientId = 42,
) {
  socket.open()
  socket.message(
    JSON.stringify({
      type: "ready",
      clientId,
      generation: "a".repeat(64),
      protocol: "editor-v1",
    }),
  )
  await settle()
  const empty = new Y.Doc()
  socket.message(syncStep2(empty))
  empty.destroy()
  await settle()
  expect(provider.getSnapshot().status).toBe("connected")
}

describe("Lexical collaboration provider", function providerContracts() {
  test.each(["arraybuffer", "view", "blob"])(
    "accepts bounded %s sync frames",
    async function binaryBoundary(kind) {
      const { provider, sockets } = makeProvider()
      const connected = provider.connect()
      await settle()
      const socket = sockets[0]
      socket.open()
      socket.message(
        JSON.stringify({
          type: "ready",
          clientId: 42,
          generation: "a".repeat(64),
          protocol: "editor-v1",
        }),
      )
      const remote = new Y.Doc()
      const frame = syncStep2(remote)
      const buffer = frame.slice().buffer
      socket.message(
        kind === "blob"
          ? new Blob([buffer])
          : kind === "view"
            ? new DataView(buffer)
            : buffer,
      )
      await connected
      expect(provider.getSnapshot().writable).toBe(true)
      provider.destroy()
      remote.destroy()
    },
  )

  test.each([42, "x".repeat(257), new Uint8Array(65537)])(
    "rejects invalid or oversized transport input",
    async function invalidTransport(data) {
      const { provider, sockets } = makeProvider()

      const rejected = provider.connect().then(
        () => false,
        () => true,
      )

      await settle()
      sockets[0].open()
      sockets[0].message(data)
      expect(await rejected).toBe(true)
      expect(provider.getSnapshot().writable).toBe(false)
      expect(provider.getSnapshot().status).toBe("error")
      provider.destroy()
    },
  )

  test("rejects initial sync without replacing a guarded local draft", async function guardedDraft() {
    const { provider, sockets } = makeProvider()
    const release = provider.registerSyncGuard(() => false)
    const connection = provider.connect()

    const rejected = connection.then(
      () => false,
      () => true,
    )

    await settle()
    const socket = sockets[0]
    socket.open()
    socket.message(
      JSON.stringify({
        type: "ready",
        clientId: 42,
        generation: "a".repeat(64),
        protocol: "editor-v1",
      }),
    )
    const remote = new Y.Doc()
    remote.getText("remote").insert(0, "server")
    socket.message(syncStep2(remote))
    expect(await rejected).toBe(true)
    expect(provider.getSnapshot().status).toBe("conflict")
    expect(provider.getSnapshot().writable).toBe(false)
    expect(provider.doc.getText("remote").toJSON()).toBe("")
    release()
    provider.destroy()
    remote.destroy()
  })

  test("notifies read-only before removing remote presence on disconnect", async function disconnectGate() {
    const { provider, sockets } = makeProvider()
    const connected = provider.connect()
    await settle()
    await ready(provider, sockets[0])
    await connected
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 1)
    encoding.writeVarUint(encoder, 43)
    encoding.writeVarUint(encoder, 1)
    encoding.writeVarString(
      encoder,
      JSON.stringify({
        user: { id: "peer", name: "Peer" },
        cursor: null,
      }),
    )
    const frame = encoding.createEncoder()
    encoding.writeVarUint(frame, 1)
    encoding.writeVarUint8Array(frame, encoding.toUint8Array(encoder))
    sockets[0].message(encoding.toUint8Array(frame))
    await settle()
    const writable: boolean[] = []

    const unsubscribe = provider.subscribe(() => {
      writable.push(provider.getSnapshot().writable)
    })

    provider.disconnect()
    expect(writable.length).toBeGreaterThan(0)
    expect(writable.every((value) => value === false)).toBe(true)
    unsubscribe()
    provider.destroy()
  })

  test("waits for initial sync, assigns server client id, and uses one-use protocol ticket", async function startsAfterSync() {
    const { provider, sockets } = makeProvider()
    const connected = provider.connect()
    await settle()
    expect(sockets).toHaveLength(1)
    await ready(provider, sockets[0])
    await connected
    expect(provider.doc.clientID).toBe(42)
    const first = sockets[0].sent[0]

    if (!(first instanceof Uint8Array)) throw new Error("sync frame missing")
    const decoder = decoding.createDecoder(first)
    expect(decoding.readVarUint(decoder)).toBe(0)
    expect(decoding.readVarUint(decoder)).toBe(sync.messageYjsSyncStep1)
    provider.destroy()
  })

  test("normalizes awareness identity and relative cursor positions", async function serverOwnsPresence() {
    const { provider, sockets } = makeProvider()
    const connected = provider.connect()
    await settle()
    await ready(provider, sockets[0])
    await connected
    const text = provider.doc.getText("cursor")
    text.insert(0, "x")
    const relative = Y.createRelativePositionFromTypeIndex(text, 1)
    provider.awareness.setLocalState({
      anchorPos: relative,
      focusPos: relative,
      name: "client-spoof",
      color: "red",
      focusing: true,
      awarenessData: { role: "admin" },
    })

    const frames = sockets[0].sent.filter(
      (value): value is Uint8Array => value instanceof Uint8Array,
    )

    const frame = frames.at(-1)

    if (!frame) throw new Error("awareness frame missing")
    const envelope = decoding.createDecoder(frame)
    expect(decoding.readVarUint(envelope)).toBe(1)
    const payload = decoding.readVarUint8Array(envelope)
    const stateDecoder = decoding.createDecoder(payload)
    expect(decoding.readVarUint(stateDecoder)).toBe(1)
    expect(decoding.readVarUint(stateDecoder)).toBe(42)
    decoding.readVarUint(stateDecoder)
    const parsed: unknown = JSON.parse(decoding.readVarString(stateDecoder))

    const state = z
      .strictObject({
        cursor: z
          .strictObject({ anchor: z.string(), head: z.string() })
          .nullable(),
        user: z.unknown().optional(),
      })
      .parse(parsed)

    expect(state.user).toBeUndefined()
    expect(state.cursor).not.toBeNull()

    if (!state.cursor) throw new Error("relative cursor positions missing")

    for (const serialized of [state.cursor.anchor, state.cursor.head]) {
      const value: unknown = JSON.parse(serialized)
      const position = Y.createRelativePositionFromJSON(value)

      const absolute = Y.createAbsolutePositionFromRelativePosition(
        position,
        provider.doc,
      )

      expect(absolute?.type).toBe(text)
      expect(absolute?.index).toBe(1)
      expect(absolute?.assoc).toBe(relative.assoc)
    }

    provider.destroy()
  })

  test("read-only provider never sends local Yjs updates and reconnect gets a fresh ticket", async function readerAndReconnect() {
    const { provider, sockets, tickets } = makeProvider("read")
    const connected = provider.connect()
    await settle()
    await ready(provider, sockets[0])
    await connected
    const before = sockets[0].sent.length
    provider.doc.getText("local").insert(0, "blocked")
    await settle()
    expect(sockets[0].sent).toHaveLength(before)
    provider.disconnect()
    const reconnecting = provider.reconnect()
    await settle()
    expect(sockets).toHaveLength(2)
    await ready(provider, sockets[1], 43)
    await reconnecting
    expect(tickets()).toBe(2)
    provider.destroy()
  })
})
