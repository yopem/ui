import type {
  Binding,
  Provider,
  ProviderAwareness,
  UserState,
} from "@lexical/yjs"

import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import {
  Awareness,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness"
import * as sync from "y-protocols/sync"
import * as Y from "yjs"
import { z } from "zod"

export type EditorCollaborationConnectionStatus =
  | "idle"
  | "connecting"
  | "syncing"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "denied"
  | "conflict"
  | "uncertain"
  | "error"

export interface EditorCollaborationPeer {
  clientId: number
  name: string
  color: string
  focusing: boolean
}

export interface EditorCollaborationSnapshot {
  status: EditorCollaborationConnectionStatus
  writable: boolean
  peers: readonly EditorCollaborationPeer[]
}

export interface EditorCollaborationWebSocket extends EventTarget {
  readyState: number
  bufferedAmount: number
  binaryType: BinaryType
  send(data: string | ArrayBuffer | Uint8Array<ArrayBuffer>): void
  close(code?: number, reason?: string): void
}

export interface EditorCollaborationClientOptions {
  documentId: string
  permission: "read" | "write"
  ticketUrl: string
  socketUrl: string
  headers?(signal: AbortSignal): HeadersInit | Promise<HeadersInit>
  fetcher?(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  webSocketFactory?(
    url: string,
    protocols: string[],
  ): EditorCollaborationWebSocket
  connectTimeoutMs?: number
  displayName?: string
  cursorColor?: string
  awarenessData?: object
}

interface ProviderEvents {
  sync: boolean
  status: { status: string }
  update: Uint8Array
  reload: Y.Doc
}

type ProviderListeners = {
  [Key in keyof ProviderEvents]: Set<(value: ProviderEvents[Key]) => void>
}

const clientIdSchema = z.number().int().min(0).max(4294967295)

const generationSchema = z.string().regex(/^[a-f0-9]{64}$/)

const ticketSchema = z.strictObject({
  ticket: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.number().int().positive(),
  protocol: z.literal("editor-v1"),
})

const readySchema = z.strictObject({
  type: z.literal("ready"),
  clientId: clientIdSchema,
  generation: generationSchema,
  protocol: z.literal("editor-v1"),
})

const deliverySchema = z.strictObject({
  delivery: z.string().regex(/^[a-f0-9]{32}$/),
})

const ackedSchema = z.strictObject({
  acked: z.string().regex(/^[a-f0-9]{32}$/),
})

const idSchema = z.strictObject({
  client: clientIdSchema,
  clock: z.number().int().min(0).max(4294967295),
})

const relativePositionSchema = z.strictObject({
  type: idSchema.nullable(),
  tname: z.string().nullable(),
  item: idSchema.nullable(),
  assoc: z.number().int(),
})

const yRelativePositionSchema = z.custom<Y.RelativePosition>(
  (value) => relativePositionSchema.safeParse(value).success,
)

const userStateSchema = z.strictObject({
  anchorPos: yRelativePositionSchema.nullable(),
  color: z.string().max(64),
  focusing: z.boolean(),
  focusPos: yRelativePositionSchema.nullable(),
  name: z.string().max(128),
  awarenessData: z.record(z.string(), z.unknown()),
})

const localAwarenessSchema = z.object({
  anchorPos: yRelativePositionSchema.nullable().optional(),
  focusPos: yRelativePositionSchema.nullable().optional(),
  focusing: z.boolean().optional(),
})

const presenceUserSchema = z.strictObject({
  id: z.string().min(1).max(256),
  name: z.string().max(128),
})

const presenceCursorSchema = z
  .strictObject({ anchor: z.string().max(512), head: z.string().max(512) })
  .nullable()

const presenceSchema = z.strictObject({
  user: presenceUserSchema,
  cursor: presenceCursorSchema,
})

const changeSchema = z.object({
  added: z.array(clientIdSchema),
  updated: z.array(clientIdSchema),
  removed: z.array(clientIdSchema),
})

const binaryFrameSchema = z.union([
  z.instanceof(ArrayBuffer),
  z.custom<ArrayBufferView>((value) => ArrayBuffer.isView(value)),
  z.instanceof(Blob),
])

const incomingFrameSchema = z.union([
  z
    .string()
    .max(256)
    .transform((data) => ({ kind: "text" as const, data })),
  binaryFrameSchema.transform((data) => ({ kind: "binary" as const, data })),
])

type IncomingFrame = z.infer<typeof incomingFrameSchema>

type BinaryFrame = z.infer<typeof binaryFrameSchema>

type PresenceCursor = z.infer<typeof presenceCursorSchema>

type AwarenessChange = z.infer<typeof changeSchema>

const emptyVector = Uint8Array.of(0)

const displayNameSchema = z.string().trim().min(1).max(128)

const cursorColorSchema = z.string().trim().min(1).max(64)

const maxFrameBytes = 65536

const maxStateBytes = 61440

function colorForClient(clientId: number) {
  return `hsl(${clientId % 360} 64% 42%)`
}

function socketOrigin(url: URL) {
  return `${url.protocol === "wss:" ? "https:" : "http:"}//${url.host}`
}

function vectorFrame() {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  encoding.writeVarUint(encoder, sync.messageYjsSyncStep1)
  encoding.writeVarUint8Array(encoder, emptyVector)

  return encoding.toUint8Array(encoder)
}

function updateFrame(update: Uint8Array) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 0)
  sync.writeUpdate(encoder, update)

  return encoding.toUint8Array(encoder)
}

function awarenessFrame(payload: Uint8Array) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint8Array(encoder, payload)

  return encoding.toUint8Array(encoder)
}

function awarenessPayload(
  clientId: number,
  clock: number,
  state: UserState | { cursor: PresenceCursor } | null,
) {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, 1)
  encoding.writeVarUint(encoder, clientId)
  encoding.writeVarUint(encoder, clock)
  encoding.writeVarString(encoder, JSON.stringify(state))
  const result = encoding.toUint8Array(encoder)

  if (result.byteLength > 4096) throw new Error("awareness limit")

  return result
}

function updateCovered(serverUpdate: Uint8Array, localUpdate: Uint8Array) {
  const server = Y.decodeUpdate(serverUpdate)
  const local = Y.decodeUpdate(localUpdate)

  const stateVector = Y.decodeStateVector(
    Y.encodeStateVectorFromUpdate(serverUpdate),
  )

  for (const struct of local.structs)
    if (
      (stateVector.get(struct.id.client) ?? 0) <
      struct.id.clock + struct.length
    )
      return false

  for (const [clientId, deleted] of local.ds.clients) {
    const remote = server.ds.clients.get(clientId) ?? []

    for (const range of deleted) {
      const end = range.clock + range.len
      let cursor = range.clock

      for (const item of remote) {
        if (item.clock > cursor) break

        if (item.clock + item.len > cursor)
          cursor = Math.min(end, item.clock + item.len)

        if (cursor >= end) break
      }

      if (cursor < end) return false
    }
  }

  return true
}

function parsePresenceCursor(value: string) {
  const parsed: unknown = JSON.parse(value)
  const position = relativePositionSchema.parse(parsed)

  return new Y.RelativePosition(
    position.type,
    position.tname,
    position.item,
    position.assoc,
  )
}

async function responseTicket(response: Response) {
  const reader = response.body?.getReader()

  if (!reader) throw new Error("invalid collaboration ticket response")
  const chunks: Uint8Array[] = []
  let size = 0

  while (true) {
    const result = await reader.read()

    if (result.done) break
    size += result.value.byteLength

    if (size > 4096 || chunks.length >= 16) {
      await reader.cancel()
      throw new Error("collaboration ticket response limit")
    }

    chunks.push(result.value)
  }

  const bytes = new Uint8Array(size)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return ticketSchema.parse(JSON.parse(new TextDecoder().decode(bytes)))
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error("collaboration request aborted"))

    if (signal.aborted) {
      onAbort()

      return
    }

    signal.addEventListener("abort", onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort)
        resolve(value)
      },
      (cause: unknown) => {
        signal.removeEventListener("abort", onAbort)
        reject(
          cause instanceof Error
            ? cause
            : new Error("collaboration request failed", { cause }),
        )
      },
    )
  })
}

function closeCode(event: Event) {
  return z.object({ code: z.number().int().min(0).max(65535) }).parse(event)
    .code
}

function incomingSize(frame: IncomingFrame) {
  if (frame.kind === "text")
    return new TextEncoder().encode(frame.data).byteLength

  if (frame.data instanceof Blob) return frame.data.size

  return frame.data.byteLength
}

export class EditorCollaborationProvider implements Provider {
  readonly doc: Y.Doc
  readonly awareness: ProviderAwareness
  private readonly awarenessDoc: Awareness
  readonly displayName: string
  readonly cursorColor: string
  readonly awarenessData: object
  readonly permission: "read" | "write"
  private readonly options: EditorCollaborationClientOptions
  private readonly listeners: ProviderListeners = {
    sync: new Set(),
    status: new Set(),
    update: new Set(),
    reload: new Set(),
  }
  private readonly subscribers = new Set<() => void>()
  private readonly pendingUpdates: Uint8Array[] = []
  private readonly documentUpdateListener: (
    update: Uint8Array,
    cause: unknown,
  ) => void
  private readonly awarenessListener: (
    change: AwarenessChange,
    cause: unknown,
  ) => void
  private snapshot: EditorCollaborationSnapshot = {
    status: "idle",
    writable: false,
    peers: [],
  }
  private status: EditorCollaborationConnectionStatus = "idle"
  private socket: EditorCollaborationWebSocket | undefined
  private connectionPromise: Promise<void> | undefined
  private connectionTimer: ReturnType<typeof setTimeout> | undefined
  private ticketController: AbortController | undefined
  private cancelConnection: (() => void) | undefined
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private reconnectAttempt = 0
  private terminalStatus: EditorCollaborationConnectionStatus | undefined
  private generation: string | undefined
  private assignedClientId: number | undefined
  private ready = false
  private synced = false
  private manualDisconnect = false
  private suppressAwareness = false
  private receiveTail: Promise<void> = Promise.resolve()
  private queuedReceiveCount = 0
  private queuedReceiveBytes = 0
  private pendingBytes = 0
  private destroyed = false
  private syncGuard: (() => boolean) | undefined
  private bindingOrigin: Binding | undefined
  private releaseSocket: (() => void) | undefined

  constructor(options: EditorCollaborationClientOptions) {
    this.options = options
    this.permission = options.permission
    const timeout = options.connectTimeoutMs ?? 15000
    const ticketUrl = new URL(options.ticketUrl)
    const socketUrl = new URL(options.socketUrl)

    if (
      !/^[A-Za-z0-9_-]+:[A-Za-z0-9_:-]+$/.test(options.documentId) ||
      options.documentId.length > 256 ||
      (options.permission !== "read" && options.permission !== "write") ||
      ticketUrl.protocol !== "https:" ||
      socketUrl.protocol !== "wss:" ||
      ticketUrl.search ||
      ticketUrl.hash ||
      socketUrl.search ||
      socketUrl.hash ||
      ticketUrl.username ||
      ticketUrl.password ||
      socketUrl.username ||
      socketUrl.password ||
      socketOrigin(socketUrl) !== ticketUrl.origin ||
      !Number.isSafeInteger(timeout) ||
      timeout < 1000 ||
      timeout > 60000
    )
      throw new Error("invalid collaboration client configuration")

    this.displayName = displayNameSchema.parse(
      options.displayName ?? "Collaborator",
    )
    this.cursorColor = cursorColorSchema.parse(
      options.cursorColor ?? "hsl(212 75% 42%)",
    )
    this.awarenessData = options.awarenessData ?? {}
    this.doc = new Y.Doc()
    this.awarenessDoc = new Awareness(this.doc)
    this.awareness = {
      getLocalState: () => {
        const result = userStateSchema.safeParse(
          this.awarenessDoc.getLocalState(),
        )

        return result.success ? result.data : null
      },
      getStates: () => {
        const states = new Map<number, UserState>()

        for (const [clientId, value] of this.awarenessDoc.getStates()) {
          const state = userStateSchema.safeParse(value)

          if (state.success) states.set(clientId, state.data)
        }

        return states
      },
      on: (_type, listener) => this.awarenessDoc.on("update", listener),
      off: (_type, listener) => this.awarenessDoc.off("update", listener),
      setLocalState: (state) => this.awarenessDoc.setLocalState(state),
      setLocalStateField: (field, value) =>
        this.awarenessDoc.setLocalStateField(field, value),
    }
    this.documentUpdateListener = this.onDocumentUpdate.bind(this)
    this.doc.on("update", this.documentUpdateListener)
    this.awarenessListener = this.onAwarenessUpdate.bind(this)
    this.awarenessDoc.on("update", this.awarenessListener)
  }

  registerSyncGuard(guard: () => boolean) {
    if (this.destroyed) throw new Error("provider destroyed")

    if (this.synced) throw new Error("bind editor before connecting provider")

    if (this.syncGuard)
      throw new Error("collaboration provider already has an editor")
    this.syncGuard = guard

    return () => {
      if (this.syncGuard === guard) this.syncGuard = undefined
    }
  }

  registerBindingOrigin(origin: Binding) {
    this.bindingOrigin = origin

    return () => {
      if (this.bindingOrigin === origin) this.bindingOrigin = undefined
    }
  }

  preserveLocalDraft() {
    this.terminalStatus = "conflict"
    this.synced = false
    this.setStatus("conflict")
    this.clearRemoteAwareness()
    this.socket?.close(1008, "local document requires host reconciliation")
  }

  getSnapshot = () => this.snapshot

  get clientId() {
    return this.assignedClientId
  }

  subscribe = (listener: () => void) => {
    this.subscribers.add(listener)

    return () => {
      this.subscribers.delete(listener)
    }
  }

  on(type: "sync", listener: (value: boolean) => void): void
  on(type: "status", listener: (value: { status: string }) => void): void
  on(type: "update", listener: (value: Uint8Array) => void): void
  on(type: "reload", listener: (value: Y.Doc) => void): void
  on<Key extends keyof ProviderEvents>(
    type: Key,
    listener: (value: ProviderEvents[Key]) => void,
  ) {
    this.listeners[type].add(listener)
  }

  off(type: "sync", listener: (value: boolean) => void): void
  off(type: "status", listener: (value: { status: string }) => void): void
  off(type: "update", listener: (value: Uint8Array) => void): void
  off(type: "reload", listener: (value: Y.Doc) => void): void
  off<Key extends keyof ProviderEvents>(
    type: Key,
    listener: (value: ProviderEvents[Key]) => void,
  ) {
    this.listeners[type].delete(listener)
  }

  connect() {
    if (this.destroyed) return Promise.reject(new Error("provider destroyed"))

    if (this.status === "connected") return Promise.resolve()

    if (this.connectionPromise) return this.connectionPromise

    if (this.terminalStatus)
      return Promise.reject(new Error(this.terminalStatus))

    this.manualDisconnect = false
    this.setStatus(this.reconnectAttempt ? "reconnecting" : "connecting")

    const connection = this.startConnection().finally(() => {
      if (this.connectionPromise === connection)
        this.connectionPromise = undefined
    })

    this.connectionPromise = connection

    return connection
  }

  disconnect() {
    this.manualDisconnect = true
    clearTimeout(this.reconnectTimer)
    clearTimeout(this.connectionTimer)
    this.reconnectTimer = undefined
    this.connectionTimer = undefined
    this.ticketController?.abort()
    this.ticketController = undefined
    this.synced = false
    this.ready = false
    const socket = this.socket
    this.socket = undefined
    this.cancelConnection?.()
    this.cancelConnection = undefined
    this.bindConnectionComplete = undefined
    this.releaseSocket?.()
    this.releaseSocket = undefined

    this.setStatus("disconnected")
    this.clearRemoteAwareness()

    if (socket && socket.readyState < 2) socket.close(1000, "client disconnect")
  }

  reconnect() {
    if (this.destroyed) return Promise.reject(new Error("provider destroyed"))

    const current = this.connectionPromise
    this.disconnect()
    this.terminalStatus = undefined

    if (current)
      return current
        .catch(() => undefined)
        .then(() => {
          this.manualDisconnect = false

          return this.connect()
        })

    this.manualDisconnect = false

    return this.connect()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.disconnect()
    this.doc.off("update", this.documentUpdateListener)
    this.awarenessDoc.off("update", this.awarenessListener)
    this.awarenessDoc.destroy()
    this.doc.destroy()
    this.subscribers.clear()

    for (const listeners of Object.values(this.listeners)) listeners.clear()
    this.syncGuard = undefined
    this.bindingOrigin = undefined
  }

  private async startConnection() {
    try {
      const ticket = await this.requestTicket()

      if (this.manualDisconnect || this.destroyed)
        throw new Error("disconnected")

      const socket = (
        this.options.webSocketFactory?.bind(this.options) ??
        this.createWebSocket.bind(this)
      )(this.options.socketUrl, ["editor-v1", ticket.ticket])

      socket.binaryType = "arraybuffer"
      this.socket = socket

      return await new Promise<void>((resolve, reject) => {
        let settled = false

        const cancel = () => {
          if (settled) return
          settled = true
          this.cancelConnection = undefined
          reject(new Error("disconnected"))
        }

        this.cancelConnection = cancel

        const onMessage = (event: Event) => {
          if (!(event instanceof MessageEvent) || this.socket !== socket) return
          const parsed = incomingFrameSchema.safeParse(event.data)
          const size = parsed.success ? incomingSize(parsed.data) : undefined

          if (
            !parsed.success ||
            size === undefined ||
            size > (parsed.data.kind === "text" ? 256 : maxFrameBytes) ||
            this.queuedReceiveCount >= 32 ||
            this.queuedReceiveBytes + size > 1048576
          ) {
            this.failSocket(
              socket,
              new Error("collaboration receive queue is full"),
              reject,
            )

            return
          }

          this.queuedReceiveCount++
          this.queuedReceiveBytes += size
          this.receiveTail = this.receiveTail
            .then(() => this.receive(socket, parsed.data, reject))
            .catch((cause: unknown) =>
              this.failSocket(
                socket,
                cause instanceof Error
                  ? cause
                  : new Error("collaboration receive failed", { cause }),
                reject,
              ),
            )
            .finally(() => {
              this.queuedReceiveCount--
              this.queuedReceiveBytes -= size
            })
        }

        const onClose = (event: Event) => {
          if (this.socket !== socket) return
          this.socket = undefined
          this.releaseSocket?.()
          this.releaseSocket = undefined
          clearTimeout(this.connectionTimer)
          this.connectionTimer = undefined
          this.cancelConnection = undefined
          this.ready = false
          this.synced = false
          const code = closeCode(event)
          const terminal = this.terminalStatus

          if (!settled) {
            settled = true
            reject(new Error(terminal ?? "collaboration connection closed"))
          }

          if (terminal) this.setStatus(terminal)
          else if (code === 1008) {
            this.terminalStatus = "denied"
            this.setStatus("denied")
          } else if (this.manualDisconnect) this.setStatus("disconnected")
          else {
            this.setStatus("reconnecting")
            this.scheduleReconnect()
          }

          this.clearRemoteAwareness()
        }

        const onError = () => {
          if (this.socket !== socket) return
          this.synced = false
          this.setStatus(this.terminalStatus ?? "reconnecting")
          this.clearRemoteAwareness()
          socket.close(1011, "collaboration transport error")
        }

        socket.addEventListener("message", onMessage)
        socket.addEventListener("close", onClose)
        socket.addEventListener("error", onError)
        this.releaseSocket = () => {
          socket.removeEventListener("message", onMessage)
          socket.removeEventListener("close", onClose)
          socket.removeEventListener("error", onError)
        }

        this.connectionTimer = setTimeout(() => {
          if (this.socket === socket && !this.synced)
            this.failSocket(
              socket,
              new Error("collaboration sync timeout"),
              reject,
              true,
            )
        }, this.options.connectTimeoutMs ?? 15000)

        const complete = () => {
          if (settled) return
          settled = true
          this.cancelConnection = undefined
          clearTimeout(this.connectionTimer)
          this.connectionTimer = undefined
          resolve()
        }

        this.bindConnectionComplete = complete
      })
    } catch (error) {
      if (this.terminalStatus) this.setStatus(this.terminalStatus)
      else if (!this.manualDisconnect) {
        this.setStatus(this.reconnectAttempt ? "reconnecting" : "error")
        this.scheduleReconnect()
      }

      throw error
    }
  }

  private bindConnectionComplete: (() => void) | undefined

  private createWebSocket(url: string, protocols: string[]) {
    return new WebSocket(url, protocols)
  }

  private async requestTicket() {
    const controller = new AbortController()
    this.ticketController = controller

    const timer = setTimeout(
      () => controller.abort(),
      this.options.connectTimeoutMs ?? 15000,
    )

    try {
      const headers = new Headers(
        await abortable(
          Promise.resolve(this.options.headers?.(controller.signal)),
          controller.signal,
        ),
      )

      headers.set("X-Editor-Permission", this.options.permission)

      const fetcher =
        this.options.fetcher?.bind(this.options) ?? globalThis.fetch

      const response = await abortable(
        fetcher(this.options.ticketUrl, {
          method: "POST",
          headers,
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        }),
        controller.signal,
      )

      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          this.terminalStatus = "denied"
        else if (response.status === 409) this.terminalStatus = "conflict"

        throw new Error("collaboration ticket request failed")
      }

      const ticket = await abortable(
        responseTicket(response),
        controller.signal,
      )

      if (ticket.expiresAt <= Date.now()) throw new Error("ticket expired")

      return ticket
    } finally {
      clearTimeout(timer)

      if (this.ticketController === controller)
        this.ticketController = undefined
    }
  }

  private onDocumentUpdate(update: Uint8Array, cause: unknown) {
    if (cause === this) return

    if (this.options.permission === "read" && cause === this.bindingOrigin)
      return

    if (this.options.permission !== "write") {
      this.terminalStatus = "denied"
      this.setStatus("denied")
      this.socket?.close(1008, "read-only collaboration client")

      return
    }

    if (
      this.pendingUpdates.length >= 64 ||
      this.pendingBytes + update.byteLength > 1048576
    ) {
      this.terminalStatus = "uncertain"
      this.setStatus("uncertain")
      this.socket?.close(1011, "local collaboration queue is full")

      return
    }

    const copy = update.slice()
    this.pendingUpdates.push(copy)
    this.pendingBytes += copy.byteLength
    this.emit("update", copy)

    if (this.status === "connected") {
      try {
        this.sendBinary(updateFrame(copy))
      } catch {
        this.terminalStatus = "uncertain"
        this.setStatus("uncertain")
        this.socket?.close(1011, "local collaboration update is uncertain")
      }
    }
  }

  private onAwarenessUpdate(change: AwarenessChange, cause: unknown) {
    if (cause === this) {
      this.publish()

      return
    }

    if (this.suppressAwareness || !this.synced) return
    const parsed = changeSchema.safeParse(change)

    if (!parsed.success) return
    const localId = this.awarenessDoc.clientID

    const changed = [
      ...parsed.data.added,
      ...parsed.data.updated,
      ...parsed.data.removed,
    ].includes(localId)

    if (!changed) {
      this.publish()

      return
    }

    this.sendLocalAwareness()
    this.publish()
  }

  private sendLocalAwareness() {
    if (!this.synced || this.socket?.readyState !== 1) return
    const local = this.awarenessDoc.getLocalState()
    const clock = this.awarenessDoc.meta.get(this.awarenessDoc.clientID)?.clock

    if (!Number.isSafeInteger(clock) || clock === undefined || clock < 1) return
    let state: { cursor: PresenceCursor } | null = null

    if (local !== null) {
      const positions = localAwarenessSchema.parse(local)
      const anchor = positions.anchorPos ?? null
      const focus = positions.focusPos ?? null

      const cursor =
        positions.focusing !== false && anchor && focus
          ? { anchor: JSON.stringify(anchor), head: JSON.stringify(focus) }
          : null

      state = { cursor }
    }

    this.sendBinary(
      awarenessFrame(
        awarenessPayload(this.awarenessDoc.clientID, clock, state),
      ),
    )
  }

  private async receive(
    socket: EditorCollaborationWebSocket,
    frameInput: IncomingFrame,
    reject: (error: Error) => void,
  ) {
    if (this.socket !== socket || this.terminalStatus || this.destroyed) return

    if (frameInput.kind === "text") {
      const data = frameInput.data

      if (new TextEncoder().encode(data).byteLength > 256)
        throw new Error("control frame limit")
      const parsed: unknown = JSON.parse(data)
      const ready = readySchema.safeParse(parsed)

      if (ready.success) {
        if (this.ready) throw new Error("duplicate ready frame")

        if (this.generation && this.generation !== ready.data.generation) {
          this.terminalStatus = "conflict"
          throw new Error("collaboration document generation changed")
        }

        this.generation = ready.data.generation
        this.assignedClientId = ready.data.clientId
        this.ready = true
        this.setStatus("syncing")
        this.sendBinary(vectorFrame())

        return
      }

      const delivery = deliverySchema.safeParse(parsed)

      if (delivery.success) {
        this.sendText(JSON.stringify({ ack: delivery.data.delivery }))

        return
      }

      if (ackedSchema.safeParse(parsed).success) return

      throw new Error("invalid collaboration control frame")
    }

    const frame = await this.binary(frameInput.data)

    if (this.socket !== socket || this.terminalStatus || this.destroyed) return

    if (frame.byteLength > maxFrameBytes)
      throw new Error("collaboration frame limit")
    const decoder = decoding.createDecoder(frame)
    const type = decoding.readVarUint(decoder)

    if (type === 1) {
      const payload = decoding.readVarUint8Array(decoder)

      if (decoding.hasContent(decoder) || payload.byteLength > 4096)
        throw new Error("invalid collaboration awareness")
      this.applyPresence(payload)

      return
    }

    if (
      type !== 0 ||
      decoding.readVarUint(decoder) !== sync.messageYjsSyncStep2
    )
      throw new Error("invalid collaboration sync message")
    const update = decoding.readVarUint8Array(decoder)

    if (decoding.hasContent(decoder) || update.byteLength > maxStateBytes)
      throw new Error("invalid collaboration state")
    this.applyServerState(update, reject)
  }

  private applyPresence(payload: Uint8Array) {
    const decoder = decoding.createDecoder(payload)
    const count = decoding.readVarUint(decoder)

    if (count > 32) throw new Error("collaboration awareness limit")

    for (let index = 0; index < count; index++) {
      const clientId = decoding.readVarUint(decoder)
      const clock = decoding.readVarUint(decoder)
      const json = decoding.readVarString(decoder)

      if (
        !clientIdSchema.safeParse(clientId).success ||
        !Number.isSafeInteger(clock) ||
        clock < 1 ||
        json.length > 2048
      )
        throw new Error("invalid collaboration awareness")
      const parsed: unknown = JSON.parse(json)

      if (parsed === null) {
        removeAwarenessStates(this.awarenessDoc, [clientId], this)
        continue
      }

      const presence = presenceSchema.parse(parsed)
      const cursor = presence.cursor

      const state: UserState = {
        anchorPos: cursor ? parsePresenceCursor(cursor.anchor) : null,
        focusPos: cursor ? parsePresenceCursor(cursor.head) : null,
        name: presence.user.name,
        color: colorForClient(clientId),
        focusing: cursor !== null,
        awarenessData: { userId: presence.user.id },
      }

      const normalized = awarenessPayload(clientId, clock, state)

      applyAwarenessUpdate(this.awarenessDoc, normalized, this)
    }

    if (decoding.hasContent(decoder))
      throw new Error("invalid collaboration awareness")
  }

  private async binary(data: BinaryFrame) {
    if (data instanceof ArrayBuffer) return new Uint8Array(data)

    if (ArrayBuffer.isView(data))
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)

    if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer())

    throw new Error("invalid collaboration frame")
  }

  private applyServerState(update: Uint8Array, reject: (error: Error) => void) {
    if (!this.ready || this.assignedClientId === undefined)
      throw new Error("collaboration sync arrived before ready")

    if (this.terminalStatus) return

    if (this.syncGuard && !this.syncGuard()) {
      this.preserveLocalDraft()
      reject(new Error("local document requires host reconciliation"))

      return
    }

    if (!this.synced) {
      const uncovered = this.pendingUpdates.some(
        (pending) => !updateCovered(update, pending),
      )

      if (uncovered) {
        this.terminalStatus = "uncertain"
        this.setStatus("uncertain")
        this.socket?.close(
          1011,
          "local collaboration update outcome is uncertain",
        )
        reject(new Error("uncertain local collaboration update"))

        return
      }

      this.pendingUpdates.length = 0
      this.pendingBytes = 0
      this.assignClientId(this.assignedClientId)
    } else {
      const remaining = this.pendingUpdates.filter(
        (pending) => !updateCovered(update, pending),
      )

      this.pendingBytes = remaining.reduce(
        (total, pending) => total + pending.byteLength,
        0,
      )
      this.pendingUpdates.splice(0, this.pendingUpdates.length, ...remaining)
    }

    Y.applyUpdate(this.doc, update, this)
    this.synced = true
    this.reconnectAttempt = 0
    this.setStatus("connected")
    this.emit("sync", true)
    this.sendLocalAwareness()
    this.publish()
    this.bindConnectionComplete?.()
  }

  private assignClientId(clientId: number) {
    const previous = this.awarenessDoc.getLocalState()
    this.suppressAwareness = true
    this.awarenessDoc.setLocalState(null)
    this.doc.clientID = clientId
    this.awarenessDoc.clientID = clientId
    this.awarenessDoc.setLocalState(previous)
    this.suppressAwareness = false
  }

  private sendBinary(data: Uint8Array) {
    if (data.byteLength > maxFrameBytes)
      throw new Error("collaboration frame limit")
    const socket = this.socket

    if (socket?.readyState !== 1)
      throw new Error("collaboration socket is not open")
    const buffered = socket.bufferedAmount

    if (
      !Number.isSafeInteger(buffered) ||
      buffered < 0 ||
      buffered + data.byteLength > 1048576
    )
      throw new Error("collaboration socket queue is full")
    socket.send(data.slice())
  }

  private sendText(data: string) {
    const socket = this.socket

    if (socket?.readyState !== 1)
      throw new Error("collaboration socket is not open")
    const buffered = socket.bufferedAmount

    if (
      !Number.isSafeInteger(buffered) ||
      buffered < 0 ||
      buffered + data.length > 1048576
    )
      throw new Error("collaboration socket queue is full")
    socket.send(data)
  }

  private failSocket(
    socket: EditorCollaborationWebSocket,
    error: Error,
    reject: (error: Error) => void,
    retry = false,
  ) {
    if (this.socket !== socket) return

    if (retry) {
      this.socket = undefined
      this.releaseSocket?.()
      this.releaseSocket = undefined
      this.ready = false
      this.synced = false
      this.cancelConnection = undefined
      this.bindConnectionComplete = undefined
      clearTimeout(this.connectionTimer)
      this.connectionTimer = undefined
      this.setStatus("reconnecting")
      this.clearRemoteAwareness()
      this.scheduleReconnect()
      socket.close(1011, "collaboration sync timeout")
      reject(error)

      return
    }

    this.terminalStatus ??= "error"
    this.synced = false
    clearTimeout(this.connectionTimer)
    this.connectionTimer = undefined
    this.bindConnectionComplete = undefined
    this.setStatus(this.terminalStatus)
    this.clearRemoteAwareness()
    socket.close(1008, "invalid collaboration message")
    reject(error)
  }

  private scheduleReconnect() {
    if (this.manualDisconnect || this.terminalStatus || this.reconnectTimer)
      return
    const delay = Math.min(250 * 2 ** this.reconnectAttempt, 30000)
    this.reconnectAttempt++
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      void this.connect().catch(() => undefined)
    }, delay)
  }

  private clearRemoteAwareness() {
    const clients = [...this.awarenessDoc.getStates().keys()].filter(
      (clientId) => clientId !== this.awarenessDoc.clientID,
    )

    if (clients.length) removeAwarenessStates(this.awarenessDoc, clients, this)
  }

  private setStatus(status: EditorCollaborationConnectionStatus) {
    if (this.status === status) return
    this.status = status
    this.publish()

    if (status !== "connected") this.emit("sync", false)
    this.emit("status", { status })
  }

  private publish() {
    const peers: EditorCollaborationPeer[] = []

    for (const [clientId, value] of this.awarenessDoc.getStates()) {
      if (clientId === this.awarenessDoc.clientID) continue

      const parsed = z
        .object({
          name: z.string().max(128),
          color: z.string().max(64),
          focusing: z.boolean().optional(),
        })
        .safeParse(value)

      if (!parsed.success) continue
      peers.push({
        clientId,
        name: parsed.data.name,
        color: parsed.data.color,
        focusing: parsed.data.focusing ?? false,
      })
    }

    peers.sort((left, right) => left.clientId - right.clientId)
    this.snapshot = {
      status: this.status,
      writable:
        this.options.permission === "write" && this.status === "connected",
      peers,
    }

    for (const subscriber of this.subscribers) subscriber()
  }

  private emit<Key extends keyof ProviderEvents>(
    type: Key,
    value: ProviderEvents[Key],
  ) {
    for (const listener of this.listeners[type]) listener(value)
  }
}
