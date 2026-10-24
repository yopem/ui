import type { ClientRequest, IncomingMessage } from "node:http"

import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import { Buffer } from "node:buffer"
import { WebSocket, type RawData } from "ws"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"
import { z } from "zod"

import {
  nativeDocumentId,
  nativeOrigin,
  type NativeCollaborationFixture,
} from "./native-fixture"

export type NativeSocketMessage =
  | { kind: "binary"; bytes: Uint8Array }
  | { kind: "text"; text: string }

export type NativeUpgradeResult =
  | { kind: "opened" }
  | { kind: "rejected"; status: number }
  | { kind: "closed" }
  | { kind: "failed" }
  | { kind: "timeout" }

interface NativeMessageWaiter {
  resolve(message: NativeSocketMessage): void
  reject(error: Error): void
  timer: ReturnType<typeof setTimeout>
}

interface NativeMessageChannel {
  messages: NativeSocketMessage[]
  waiters: NativeMessageWaiter[]
  error: Error | undefined
}

const readySchema = z.strictObject({
  type: z.literal("ready"),
  clientId: z.number().int().min(0).max(4294967295),
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  protocol: z.literal("editor-v1"),
})

const deliverySchema = z.strictObject({
  delivery: z.string().regex(/^[a-f0-9]{32}$/),
})

const ackedSchema = z.strictObject({
  acked: z.string().regex(/^[a-f0-9]{32}$/),
})

const messageChannels = new WeakMap<WebSocket, NativeMessageChannel>()

function bytesOf(data: RawData) {
  if (Buffer.isBuffer(data)) return data

  if (Array.isArray(data)) return Buffer.concat(data)

  return Buffer.from(data)
}

function controlValue(message: NativeSocketMessage) {
  if (message.kind !== "text")
    throw new Error("expected a collaboration control frame")
  const value: unknown = JSON.parse(message.text)

  return value
}

export function nativeSocketUrl(baseUrl: string) {
  const url = new URL(
    `/collaboration/${encodeURIComponent(nativeDocumentId)}/socket`,
    baseUrl,
  )

  url.protocol = "ws:"

  return url.toString()
}

export function newNativeSocket(
  baseUrl: string,
  ticket: string,
  headers: Record<string, string> = {},
) {
  return new WebSocket(nativeSocketUrl(baseUrl), ["editor-v1", ticket], {
    headers: { Origin: nativeOrigin, ...headers },
  })
}

export function waitForNativeUpgrade(
  socket: WebSocket,
  timeoutMs = 3000,
): Promise<NativeUpgradeResult> {
  return new Promise((resolve) => {
    let settled = false

    const timer = setTimeout(function timedOut() {
      socket.terminate()
      finish({ kind: "timeout" })
    }, timeoutMs)

    function finish(result: NativeUpgradeResult) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.off("open", opened)
      socket.off("unexpected-response", rejected)
      socket.off("close", closed)
      socket.off("error", failed)
      resolve(result)
    }

    function opened() {
      finish({ kind: "opened" })
    }

    function rejected(_request: ClientRequest, response: IncomingMessage) {
      const status = response.statusCode ?? 0
      response.resume()
      finish({ kind: "rejected", status })
      socket.terminate()
    }

    function closed() {
      finish({ kind: "closed" })
    }

    function failed() {
      finish({ kind: "failed" })
    }

    socket.on("open", opened)
    socket.on("unexpected-response", rejected)
    socket.on("close", closed)
    socket.on("error", failed)
  })
}

function messageChannel(socket: WebSocket) {
  const existing = messageChannels.get(socket)

  if (existing) return existing

  const channel: NativeMessageChannel = {
    messages: [],
    waiters: [],
    error: undefined,
  }

  function finish(error: Error) {
    if (channel.error) return
    channel.error = error

    for (const waiter of channel.waiters) {
      clearTimeout(waiter.timer)
      waiter.reject(error)
    }

    channel.waiters.length = 0
    socket.off("message", received)
    socket.off("close", closed)
    socket.off("error", failed)
  }

  function received(data: RawData, binary: boolean) {
    const bytes = bytesOf(data)

    const message = binary
      ? { kind: "binary" as const, bytes }
      : { kind: "text" as const, text: bytes.toString("utf8") }

    const waiter = channel.waiters.shift()

    if (!waiter) {
      channel.messages.push(message)

      return
    }

    clearTimeout(waiter.timer)
    waiter.resolve(message)
  }

  function closed() {
    finish(new Error("native collaboration socket closed before a frame"))
  }

  function failed() {
    finish(new Error("native collaboration socket failed before a frame"))
  }

  messageChannels.set(socket, channel)
  socket.on("message", received)
  socket.on("close", closed)
  socket.on("error", failed)

  return channel
}

export function receiveNativeMessage(
  socket: WebSocket,
  timeoutMs = 3000,
): Promise<NativeSocketMessage> {
  const channel = messageChannel(socket)
  const message = channel.messages.shift()

  if (message) return Promise.resolve(message)

  if (channel.error) return Promise.reject(channel.error)

  return new Promise((resolve, reject) => {
    const waiter: NativeMessageWaiter = {
      resolve,
      reject,
      timer: setTimeout(function timedOut() {
        const index = channel.waiters.indexOf(waiter)

        if (index !== -1) channel.waiters.splice(index, 1)
        reject(new Error("timed out waiting for a native collaboration frame"))
      }, timeoutMs),
    }

    channel.waiters.push(waiter)
  })
}

export function waitForNativeClose(
  socket: WebSocket,
  timeoutMs = 3000,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(function timedOut() {
      cleanup()
      reject(new Error("timed out waiting for native collaboration close"))
    }, timeoutMs)

    function cleanup() {
      clearTimeout(timer)
      socket.off("close", closed)
      socket.off("error", failed)
    }

    function closed(code: number) {
      cleanup()
      resolve(code)
    }

    function failed() {
      cleanup()
      reject(new Error("native collaboration socket failed before close"))
    }

    socket.on("close", closed)
    socket.on("error", failed)
  })
}

export async function closeNativeSocket(socket: WebSocket) {
  if (socket.readyState === WebSocket.CLOSED) return

  await new Promise<void>((resolve) => {
    let settled = false

    const timer = setTimeout(function terminate() {
      socket.terminate()
      finish()
    }, 1000)

    function finish() {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.off("close", finish)
      socket.off("error", finish)
      resolve()
    }

    socket.on("close", finish)
    socket.on("error", finish)

    if (socket.readyState === WebSocket.CONNECTING) socket.terminate()
    else socket.close(1000, "test cleanup")
  })
}

export async function requestNativeTicket(
  baseUrl: string,
  fixture: NativeCollaborationFixture,
  permission: "read" | "write",
  overrides: Record<string, string> = {},
) {
  return await fetch(
    new URL(
      `/collaboration/${encodeURIComponent(nativeDocumentId)}/ticket`,
      baseUrl,
    ),
    {
      method: "POST",
      headers: fixture.ticketHeaders(permission, overrides),
    },
  )
}

export async function issueNativeTicket(
  baseUrl: string,
  fixture: NativeCollaborationFixture,
  permission: "read" | "write",
) {
  const response = await requestNativeTicket(baseUrl, fixture, permission)

  if (!response.ok)
    throw new Error(`ticket request failed with ${response.status}`)
  const value: unknown = await response.json()

  return z
    .strictObject({
      ticket: z.string().regex(/^[a-f0-9]{64}$/),
      expiresAt: z.number().int().positive(),
      protocol: z.literal("editor-v1"),
    })
    .parse(value).ticket
}

export function vectorFrame(doc: Y.Doc) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  sync.writeSyncStep1(encoder, doc)

  return encoding.toUint8Array(encoder)
}

export function updateFrame(doc: Y.Doc) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  sync.writeUpdate(encoder, Y.encodeStateAsUpdate(doc))

  return encoding.toUint8Array(encoder)
}

export function applySyncStep2(doc: Y.Doc, frame: Uint8Array) {
  const decoder = decoding.createDecoder(frame)

  if (decoding.readVarUint(decoder) !== 0)
    throw new Error("expected a Yjs sync frame")

  if (decoding.readVarUint(decoder) !== sync.messageYjsSyncStep2)
    throw new Error("expected a Yjs sync step 2 frame")
  Y.applyUpdate(doc, decoding.readVarUint8Array(decoder))
}

export function parseNativeReady(message: NativeSocketMessage) {
  return readySchema.parse(controlValue(message))
}

export function parseNativeDelivery(message: NativeSocketMessage) {
  return deliverySchema.parse(controlValue(message)).delivery
}

export function parseNativeAcked(message: NativeSocketMessage) {
  return ackedSchema.parse(controlValue(message)).acked
}

export async function synchronizeNativeSocket(
  socket: WebSocket,
  document: Y.Doc,
  generation: string,
  firstMessage: Promise<NativeSocketMessage>,
) {
  const ready = parseNativeReady(await firstMessage)

  if (ready.generation !== generation)
    throw new Error("collaboration generation did not match")
  socket.send(vectorFrame(document), { binary: true })
  const initial = await receiveNativeMessage(socket)

  if (initial.kind !== "binary")
    throw new Error("initial Yjs state was not a binary frame")
  applySyncStep2(document, initial.bytes)
  const delivery = parseNativeDelivery(await receiveNativeMessage(socket))
  socket.send(JSON.stringify({ ack: delivery }))

  if (parseNativeAcked(await receiveNativeMessage(socket)) !== delivery)
    throw new Error("initial delivery ACK did not match")

  document.clientID = ready.clientId

  return ready
}
