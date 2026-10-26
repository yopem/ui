"use client"

import type { Binding, ProviderAwareness } from "@lexical/yjs"

import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider"
import { Awareness, removeAwarenessStates } from "y-protocols/awareness"
import { WebrtcProvider } from "y-webrtc"
import * as Y from "yjs"
import { z } from "zod"

import {
  createValidatedAwarenessFacade,
  waitForEditorCollaborationRequest,
  type EditorCollaborationConnectionStatus,
  type EditorCollaborationPeer,
  type EditorCollaborationSnapshot,
  type EditorCollaborationTransport,
} from "./collaboration-client"
import {
  editorNativeRoomGrantSchema,
  validateEditorNativeGrantEndpoint,
  validateEditorNativeRoomGrant,
  validateEditorNativeSignalingUrls,
  validateEditorNativeSocketUrl,
} from "./collaboration-native-model"

const roomIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+:[A-Za-z0-9_:-]+$/)

const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[^\p{Cc}]+$/u)

const cursorColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)

const authScopeSchema = z.enum(["read-write", "readonly"])

const requestedPermissionSchema = z.enum(["read", "write"])

const relativeIdSchema = z.strictObject({
  client: z.number().int().min(0).max(4294967295),
  clock: z.number().int().min(0).max(4294967295),
})

const relativePositionSchema = z.strictObject({
  type: relativeIdSchema.nullable(),
  tname: z.string().nullable(),
  item: relativeIdSchema.nullable(),
  assoc: z.number().int(),
})

const relativePositionValueSchema = z.custom<Y.RelativePosition>(
  (value) => relativePositionSchema.safeParse(value).success,
)

const localAwarenessSchema = z.object({
  anchorPos: relativePositionValueSchema.nullable().optional(),
  focusPos: relativePositionValueSchema.nullable().optional(),
  focusing: z.boolean().optional(),
  awarenessData: z.record(z.string(), z.unknown()).optional(),
})

const grantResponseLimit = 16384

const grantChunkLimit = 32

interface ProviderEvents {
  sync: boolean
  status: { status: string }
  update: Uint8Array
  reload: Y.Doc
}

type ProviderListeners = {
  [Key in keyof ProviderEvents]: Set<(value: ProviderEvents[Key]) => void>
}

export interface EditorNativeCollaborationOptions {
  roomId: string
  trustedOrigin: string
  grantUrl: string
  socketUrl: string
  displayName: string
  cursorColor: string
  requestedPermission?: "read" | "write"
  headers(signal: AbortSignal): HeadersInit | Promise<HeadersInit>
  signalingUrls?: readonly string[]
  connectTimeoutMs?: number
  awarenessData?: object
}

export type EditorNativeWebrtcStatus =
  | "disabled"
  | "waiting"
  | "looking"
  | "stopped"
  | "error"

export interface EditorNativeCollaborationSnapshot {
  hocuspocus: {
    status: "disconnected" | "connecting" | "connected"
    authenticated: boolean
    synced: boolean
    unsyncedChanges: number
  }
  webrtc: {
    status: EditorNativeWebrtcStatus
    reportedWebrtcPeers: number
    reportedBroadcastChannelPeers: number
  }
}

interface ReadyWaiter {
  epoch: number
  resolve(): void
  reject(error: Error): void
  timer: ReturnType<typeof setTimeout>
}

interface NativeProviderEvents {
  onOpen(): void
  onAuthenticated(scope: string): void
  onAuthenticationFailed(): void
  onStatus(status: string): void
  onSynced(state: boolean): void
  onUnsyncedChanges(count: number): void
}

function currentOrigin(input: string) {
  if (typeof window === "undefined" || window.location.origin !== input)
    throw new Error("native collaboration requires the trusted browser origin")
}

async function readGrant(response: Response) {
  const reader = response.body?.getReader()

  if (!reader) throw new Error("native collaboration grant response is empty")
  const chunks: Uint8Array[] = []
  let size = 0

  while (true) {
    const result = await reader.read()

    if (result.done) break
    size += result.value.byteLength

    if (size > grantResponseLimit || chunks.length >= grantChunkLimit) {
      await reader.cancel().catch(() => undefined)
      throw new Error("native collaboration grant response limit")
    }

    chunks.push(result.value)
  }

  const bytes = new Uint8Array(size)
  let offset = 0

  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return editorNativeRoomGrantSchema.parse(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
  )
}

async function destroyPeerProvider(provider: WebrtcProvider) {
  provider.disconnect()
  provider.destroy()
  await provider.key
}

export class EditorNativeCollaborationProvider implements EditorCollaborationTransport {
  readonly doc: Y.Doc
  readonly awareness: ProviderAwareness
  readonly awarenessData: object
  private readonly options: EditorNativeCollaborationOptions
  private readonly awarenessDoc: Awareness
  private readonly listeners: ProviderListeners = {
    sync: new Set(),
    status: new Set(),
    update: new Set(),
    reload: new Set(),
  }
  private readonly subscribers = new Set<() => void>()
  private readonly documentUpdateListener: (
    update: Uint8Array,
    cause: unknown,
  ) => void
  private readonly awarenessListener: () => void
  private readonly nativeEvents: NativeProviderEvents
  private readonly signalingUrls: string[]
  private readonly grantUrl: string
  private readonly socketUrl: string
  private readonly connectTimeoutMs: number
  private readonly requestedPermission: "read" | "write"
  private serverDocument: Y.Doc | undefined
  private serverDocumentUpdateListener:
    | ((update: Uint8Array, cause: unknown) => void)
    | undefined
  private websocket: HocuspocusProviderWebsocket | undefined
  private serverProvider: HocuspocusProvider | undefined
  private peerProvider: WebrtcProvider | undefined
  private peerCleanupPromise: Promise<void> = Promise.resolve()
  private releasePeerListeners: (() => void) | undefined
  private currentGrant:
    | ReturnType<typeof validateEditorNativeRoomGrant>
    | undefined
  private authorizationPromise:
    | Promise<ReturnType<typeof validateEditorNativeRoomGrant>>
    | undefined
  private grantController: AbortController | undefined
  private expiryTimer: ReturnType<typeof setTimeout> | undefined
  private readyWaiter: ReadyWaiter | undefined
  private syncGuard: (() => boolean) | undefined
  private bindingOrigin: Binding | undefined
  private status: EditorCollaborationConnectionStatus = "idle"
  private socketStatus: EditorNativeCollaborationSnapshot["hocuspocus"]["status"] =
    "disconnected"
  private serverAuthenticated = false
  private serverSynced = false
  private sessionStateApplied = false
  private peerStatus: EditorNativeWebrtcStatus
  private reportedWebrtcPeers = 0
  private reportedBroadcastChannelPeers = 0
  private acceptedGeneration: string | undefined
  private peerStartedCycle: number | undefined
  private authCycle = 0
  private epoch = 0
  private terminalStatus: EditorCollaborationConnectionStatus | undefined
  private disposalPromise: Promise<void> = Promise.resolve()
  private manualDisconnect = true
  private destroyed = false
  private snapshot: EditorCollaborationSnapshot = {
    status: "idle",
    writable: false,
    peers: [],
  }
  private nativeSnapshot: EditorNativeCollaborationSnapshot = {
    hocuspocus: {
      status: "disconnected",
      authenticated: false,
      synced: false,
      unsyncedChanges: 0,
    },
    webrtc: {
      status: "disabled",
      reportedWebrtcPeers: 0,
      reportedBroadcastChannelPeers: 0,
    },
  }

  constructor(options: EditorNativeCollaborationOptions) {
    if (typeof window === "undefined")
      throw new Error("native collaboration is browser-only")

    this.options = options
    currentOrigin(options.trustedOrigin)
    this.roomId = roomIdSchema.parse(options.roomId)
    this.grantUrl = validateEditorNativeGrantEndpoint(
      options.grantUrl,
      options.trustedOrigin,
    )
    this.socketUrl = validateEditorNativeSocketUrl(
      options.socketUrl,
      options.trustedOrigin,
    )
    this.signalingUrls = options.signalingUrls
      ? validateEditorNativeSignalingUrls(options.signalingUrls)
      : []
    this.connectTimeoutMs = options.connectTimeoutMs ?? 15000

    if (
      !Number.isSafeInteger(this.connectTimeoutMs) ||
      this.connectTimeoutMs < 1000 ||
      this.connectTimeoutMs > 60000
    )
      throw new Error("native collaboration connection timeout rejected")

    this.requestedName = displayNameSchema.parse(options.displayName)
    this.requestedColor = cursorColorSchema.parse(options.cursorColor)
    this.requestedPermission = requestedPermissionSchema.parse(
      options.requestedPermission ?? "write",
    )
    this.awarenessData = options.awarenessData ?? {}
    this.doc = new Y.Doc()
    this.awarenessDoc = new Awareness(this.doc)
    this.awareness = createValidatedAwarenessFacade(this.awarenessDoc)
    this.peerStatus = this.signalingUrls.length ? "waiting" : "disabled"
    this.documentUpdateListener = this.onDocumentUpdate.bind(this)
    this.doc.on("update", this.documentUpdateListener)
    this.awarenessListener = this.publish.bind(this)
    this.awarenessDoc.on("update", this.awarenessListener)
    this.nativeEvents = {
      onOpen: () => this.onOpen(),
      onAuthenticated: (scope) => this.onAuthenticated(scope),
      onAuthenticationFailed: () => this.fail("denied"),
      onStatus: (status) => this.onServerStatus(status),
      onSynced: (state) => this.onServerSynced(state),
      onUnsyncedChanges: (count) => this.onUnsyncedChanges(count),
    }
    this.publish()
  }

  private readonly roomId: string
  private readonly requestedName: string
  private readonly requestedColor: string

  get displayName() {
    return this.currentGrant?.displayName ?? this.requestedName
  }

  get cursorColor() {
    return this.currentGrant?.cursorColor ?? this.requestedColor
  }

  get permission() {
    return this.permissionValue
  }

  private permissionValue: "read" | "write" = "read"

  get clientId() {
    return this.doc.clientID
  }

  getSnapshot = () => this.snapshot

  getNativeSnapshot = () => this.nativeSnapshot

  whenDisposed() {
    return this.disposalPromise
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

  registerSyncGuard(guard: () => boolean) {
    if (this.destroyed) throw new Error("provider destroyed")

    if (this.sessionStateApplied)
      throw new Error("bind editor before connecting provider")

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
    if (this.destroyed || this.terminalStatus === "conflict") return
    this.terminalStatus = "conflict"
    this.stop(
      "conflict",
      new Error("local document requires host reconciliation"),
    )
  }

  connect() {
    if (this.destroyed) return Promise.reject(new Error("provider destroyed"))

    if (this.status === "connected") return Promise.resolve()

    if (this.readyWaiter && this.readyPromise) return this.readyPromise

    if (this.terminalStatus === "conflict")
      return Promise.reject(
        new Error("local document requires host reconciliation"),
      )

    if (!this.syncGuard)
      return Promise.reject(new Error("bind editor before connecting provider"))

    this.terminalStatus = undefined
    this.manualDisconnect = false
    this.epoch++
    const epoch = this.epoch
    this.socketStatus = "connecting"
    this.serverAuthenticated = false
    this.serverSynced = false
    this.sessionStateApplied = false
    this.peerStatus = this.signalingUrls.length ? "waiting" : "disabled"
    this.setStatus(this.epoch > 1 ? "reconnecting" : "connecting")
    this.publish()

    const readyPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.readyWaiter?.epoch === epoch) this.fail("error")
      }, this.connectTimeoutMs)

      this.readyWaiter = { epoch, resolve, reject, timer }
    })

    this.readyPromise = readyPromise

    try {
      this.ensureServerProvider()
      void this.websocket?.connect().catch(() => {
        if (this.isCurrent(epoch) && !this.serverAuthenticated)
          this.fail("error")
      })
    } catch {
      this.fail("error")
    }

    return readyPromise
  }

  disconnect() {
    if (this.destroyed) return
    this.stop("disconnected")
  }

  reconnect() {
    if (this.destroyed) return Promise.reject(new Error("provider destroyed"))

    if (this.terminalStatus === "conflict")
      return Promise.reject(
        new Error("local document requires host reconciliation"),
      )
    this.stop("disconnected")
    this.terminalStatus = undefined

    return this.connect()
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.terminalStatus = "denied"
    this.stop("disconnected", new Error("provider destroyed"))
    this.doc.off("update", this.documentUpdateListener)
    this.awarenessDoc.off("update", this.awarenessListener)

    if (this.serverDocument && this.serverDocumentUpdateListener)
      this.serverDocument.off("update", this.serverDocumentUpdateListener)
    this.serverDocumentUpdateListener = undefined
    this.subscribers.clear()

    for (const listeners of Object.values(this.listeners)) listeners.clear()

    const peer = this.peerProvider
    this.peerProvider = undefined
    this.releasePeerListeners?.()
    this.releasePeerListeners = undefined
    const serverProvider = this.serverProvider
    const websocket = this.websocket
    const serverDocument = this.serverDocument
    this.serverProvider = undefined
    this.websocket = undefined
    this.serverDocument = undefined

    if (peer) {
      peer.destroy()
      this.peerCleanupPromise = Promise.resolve(peer.key).then(() => undefined)
    }

    this.disposalPromise = this.peerCleanupPromise.then(
      () =>
        this.destroyServerResources(serverProvider, websocket, serverDocument),
      () =>
        this.destroyServerResources(serverProvider, websocket, serverDocument),
    )
  }

  private readyPromise: Promise<void> | undefined
  private ensureServerProvider() {
    if (this.serverProvider && this.websocket) return

    const serverDocument = new Y.Doc()
    serverDocument.clientID = this.doc.clientID
    this.serverDocument = serverDocument
    this.serverDocumentUpdateListener = (update, origin) => {
      if (origin !== this.serverProvider || !this.isCurrent(this.epoch)) return

      if (
        !this.sessionStateApplied ||
        !this.serverAuthenticated ||
        !this.serverSynced
      )
        return

      if (!this.syncGuard?.()) {
        this.preserveLocalDraft()

        return
      }

      Y.applyUpdate(this.doc, update, this.serverProvider)
    }

    serverDocument.on("update", this.serverDocumentUpdateListener)

    const websocket = new HocuspocusProviderWebsocket({
      url: this.socketUrl,
      autoConnect: false,
      maxAttempts: 0,
    })

    this.websocket = websocket

    const provider = new HocuspocusProvider({
      name: this.roomId,
      document: serverDocument,
      awareness: this.awarenessDoc,
      websocketProvider: websocket,
      token: async () => {
        const epoch = this.epoch
        const cycle = this.authCycle
        const authorization = this.authorizationPromise

        if (!authorization)
          throw new Error("native collaboration grant is missing")

        let grant: ReturnType<typeof validateEditorNativeRoomGrant>

        try {
          grant = await authorization
        } catch {
          throw new Error("native collaboration authorization failed")
        }

        if (
          !this.isCurrent(epoch) ||
          cycle !== this.authCycle ||
          grant !== this.currentGrant ||
          grant.credentialExpiresAt <= Date.now()
        )
          throw new Error("native collaboration grant is stale")

        return grant.hocuspocusToken
      },
      onOpen: () => {
        if (
          this.serverDocument === serverDocument &&
          this.isCurrent(this.epoch)
        )
          this.nativeEvents.onOpen()
      },
      onAuthenticated: ({ scope }) => {
        if (
          this.serverDocument === serverDocument &&
          this.isCurrent(this.epoch)
        )
          this.nativeEvents.onAuthenticated(scope)
      },
      onAuthenticationFailed: () => {
        if (
          this.serverDocument === serverDocument &&
          this.isCurrent(this.epoch)
        )
          this.nativeEvents.onAuthenticationFailed()
      },
      onStatus: ({ status }) => {
        if (
          this.serverDocument === serverDocument &&
          this.isCurrent(this.epoch)
        )
          this.nativeEvents.onStatus(status)
      },
      onSynced: ({ state }) => {
        if (
          this.serverDocument === serverDocument &&
          this.isCurrent(this.epoch)
        )
          this.nativeEvents.onSynced(state)
      },
      onUnsyncedChanges: ({ number }) => {
        if (
          this.serverDocument === serverDocument &&
          this.isCurrent(this.epoch)
        )
          this.nativeEvents.onUnsyncedChanges(number)
      },
    })

    this.serverProvider = provider
    provider.attach()
  }

  private onOpen() {
    if (this.destroyed || this.manualDisconnect) return
    this.authCycle++
    const cycle = this.authCycle
    this.invalidateGrant()
    this.serverAuthenticated = false
    this.serverSynced = false
    this.sessionStateApplied = false
    this.permissionValue = "read"
    this.socketStatus = "connected"
    this.pausePeer("waiting")
    this.setStatus("syncing")
    const epoch = this.epoch
    const authorization = this.requestGrant(epoch, cycle)
    this.authorizationPromise = authorization
    this.publish()
  }

  private async requestGrant(epoch: number, cycle: number) {
    const controller = new AbortController()
    this.grantController = controller
    const deadline = Date.now() + this.connectTimeoutMs
    const timeout = setTimeout(() => controller.abort(), this.connectTimeoutMs)

    try {
      const headers = new Headers(
        await waitForEditorCollaborationRequest(
          Promise.resolve(this.options.headers(controller.signal)),
          controller.signal,
        ),
      )

      headers.set("Content-Type", "application/json")

      if (Date.now() >= deadline) controller.abort()
      controller.signal.throwIfAborted()

      if (!this.isCurrent(epoch) || cycle !== this.authCycle)
        throw new Error("native collaboration grant is stale")

      const response = await fetch(this.grantUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          roomId: this.roomId,
          displayName: this.requestedName,
          cursorColor: this.requestedColor,
          requestedPermission: this.requestedPermission,
        }),
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      })

      if (!response.ok) throw new Error("native collaboration grant rejected")
      const input = await readGrant(response)
      const grant = validateEditorNativeRoomGrant(input, this.roomId)

      if (
        controller.signal.aborted ||
        !this.isCurrent(epoch) ||
        cycle !== this.authCycle
      )
        throw new Error("native collaboration grant is stale")

      if (
        this.acceptedGeneration &&
        this.acceptedGeneration !== grant.generation
      ) {
        this.terminalStatus = "conflict"
        this.stop(
          "conflict",
          new Error("native collaboration generation changed"),
        )
        throw new Error("native collaboration generation changed")
      }

      this.acceptedGeneration ??= grant.generation
      this.currentGrant = grant
      clearTimeout(this.expiryTimer)
      this.expiryTimer = setTimeout(() => {
        if (
          this.isCurrent(epoch) &&
          cycle === this.authCycle &&
          this.currentGrant === grant
        )
          this.fail("denied")
      }, grant.credentialExpiresAt - Date.now())

      return grant
    } finally {
      clearTimeout(timeout)

      if (this.grantController === controller) this.grantController = undefined
    }
  }

  private onAuthenticated(scopeInput: string) {
    const parsedScope = authScopeSchema.safeParse(scopeInput)

    if (!parsedScope.success) {
      this.fail("denied")

      return
    }

    const scope = parsedScope.data
    const grant = this.currentGrant

    if (!grant) {
      this.fail("denied")

      return
    }

    try {
      validateEditorNativeRoomGrant(grant, this.roomId)
    } catch {
      this.fail("denied")

      return
    }

    this.serverAuthenticated = true
    this.permissionValue =
      grant.permission === "write" && scope === "read-write" ? "write" : "read"
    this.setLocalIdentity(grant)
    this.publish()
    this.maybeReady()
  }

  private setLocalIdentity(
    grant: ReturnType<typeof validateEditorNativeRoomGrant>,
  ) {
    const parsed = localAwarenessSchema.safeParse(
      this.awarenessDoc.getLocalState(),
    )

    const local = parsed.success ? parsed.data : {}

    this.awarenessDoc.setLocalState({
      anchorPos: local.anchorPos ?? null,
      focusPos: local.focusPos ?? null,
      focusing: local.focusing ?? false,
      name: grant.displayName,
      color: grant.cursorColor,
      awarenessData: local.awarenessData ?? this.awarenessData,
    })
  }

  private onServerStatus(statusInput: string) {
    const parsedStatus = z
      .enum(["connecting", "connected", "disconnected"])
      .safeParse(statusInput)

    if (!parsedStatus.success) {
      this.fail("error")

      return
    }

    const status = parsedStatus.data
    this.socketStatus = status

    if (status === "disconnected") {
      this.authCycle++
      this.invalidateGrant()
      this.serverAuthenticated = false
      this.serverSynced = false
      this.sessionStateApplied = false
      this.permissionValue = "read"
      this.pausePeer("stopped")
      this.clearRemoteAwareness()
      this.setStatus(this.manualDisconnect ? "disconnected" : "reconnecting")
    } else if (status === "connecting") {
      this.authCycle++
      this.invalidateGrant()
      this.serverAuthenticated = false
      this.serverSynced = false
      this.sessionStateApplied = false
      this.permissionValue = "read"
      this.pausePeer("waiting")
      this.setStatus(
        this.manualDisconnect || this.status === "connecting"
          ? "connecting"
          : "reconnecting",
      )
    } else if (!this.serverAuthenticated || !this.serverSynced) {
      this.setStatus("syncing")
    }

    this.publish()
  }

  private invalidateGrant() {
    this.authorizationPromise = undefined
    this.currentGrant = undefined
    this.grantController?.abort()
    this.grantController = undefined
    clearTimeout(this.expiryTimer)
    this.expiryTimer = undefined
  }

  private onServerSynced(state: boolean) {
    this.serverSynced = state

    if (!state) {
      this.sessionStateApplied = false
      this.pausePeer("waiting")
      this.setStatus("syncing")
    }

    this.publish()
    this.maybeReady()
  }

  private onUnsyncedChanges(count: number) {
    if (!Number.isSafeInteger(count) || count < 0) return
    this.nativeSnapshot = {
      ...this.nativeSnapshot,
      hocuspocus: { ...this.nativeSnapshot.hocuspocus, unsyncedChanges: count },
    }
    this.publishSubscribers()
  }

  private maybeReady() {
    const epoch = this.epoch
    const grant = this.currentGrant

    if (
      !this.isCurrent(epoch) ||
      !this.serverAuthenticated ||
      !this.serverSynced ||
      !grant ||
      grant.credentialExpiresAt <= Date.now()
    )
      return

    if (!this.sessionStateApplied) {
      if (!this.syncGuard?.()) {
        this.preserveLocalDraft()

        return
      }

      const serverDocument = this.serverDocument
      const serverProvider = this.serverProvider

      if (!serverDocument || !serverProvider) {
        this.fail("error")

        return
      }

      try {
        Y.applyUpdate(
          this.doc,
          Y.encodeStateAsUpdate(serverDocument),
          serverProvider,
        )
      } catch {
        this.fail("error")

        return
      }

      this.sessionStateApplied = true
    }

    this.setStatus("connected")
    this.publish()
    this.settleReady(epoch)

    const cycle = this.authCycle

    if (this.peerStartedCycle === cycle) return
    this.peerStartedCycle = cycle
    void this.startPeer(grant, epoch, cycle).catch(() => {
      if (!this.isCurrent(epoch) || cycle !== this.authCycle) return
      this.peerStartedCycle = undefined
      this.peerStatus = "error"

      if (this.currentGrant) this.setLocalIdentity(this.currentGrant)
      this.publish()
    })
  }

  private async startPeer(
    grant: ReturnType<typeof validateEditorNativeRoomGrant>,
    epoch: number,
    cycle: number,
  ) {
    const peer = grant.peer

    if (!peer || grant.permission !== "write" || this.permission !== "write") {
      await this.replacePeer(epoch)

      if (!this.isCurrentGrant(grant, epoch, cycle)) return
      this.setLocalIdentity(grant)
      this.peerStatus = "disabled"
      this.publish()

      return
    }

    if (!this.signalingUrls.length) {
      await this.replacePeer(epoch)

      if (!this.isCurrentGrant(grant, epoch, cycle)) return
      this.setLocalIdentity(grant)
      this.peerStatus = "disabled"
      this.publish()

      return
    }

    await this.replacePeer(epoch)

    if (!this.isCurrentGrant(grant, epoch, cycle)) return
    this.setLocalIdentity(grant)

    const provider = new WebrtcProvider(peer.room, this.doc, {
      password: peer.password,
      signaling: this.signalingUrls,
      awareness: this.awarenessDoc,
      maxConns: 9,
    })

    this.peerProvider = provider
    this.peerStatus = provider.connected ? "looking" : "waiting"
    this.reportedWebrtcPeers = 0
    this.reportedBroadcastChannelPeers = 0
    this.attachPeerListeners(provider, epoch, cycle)
    void Promise.resolve(provider.key).catch(() => {
      if (
        !this.isCurrent(epoch) ||
        cycle !== this.authCycle ||
        this.peerProvider !== provider
      )
        return
      this.peerStatus = "error"
      this.publish()
    })
    this.publish()
  }

  private async replacePeer(epoch: number) {
    const provider = this.peerProvider

    if (provider) {
      this.releasePeerListeners?.()
      this.releasePeerListeners = undefined
      this.peerProvider = undefined
      this.reportedWebrtcPeers = 0
      this.reportedBroadcastChannelPeers = 0
      this.peerCleanupPromise = destroyPeerProvider(provider)
    }

    await this.peerCleanupPromise

    if (!this.isCurrent(epoch)) return
  }

  private attachPeerListeners(
    provider: WebrtcProvider,
    epoch: number,
    cycle: number,
  ) {
    this.releasePeerListeners?.()

    const onStatus = ({ connected }: { connected: boolean }) => {
      if (
        !this.isCurrent(epoch) ||
        cycle !== this.authCycle ||
        this.peerProvider !== provider
      )
        return
      this.peerStatus = connected ? "looking" : "stopped"
      this.publish()
    }

    const onPeers = (event: { webrtcPeers: string[]; bcPeers: string[] }) => {
      if (
        !this.isCurrent(epoch) ||
        cycle !== this.authCycle ||
        this.peerProvider !== provider
      )
        return
      this.reportedWebrtcPeers = event.webrtcPeers.length
      this.reportedBroadcastChannelPeers = event.bcPeers.length
      this.publish()
    }

    provider.on("status", onStatus)
    provider.on("peers", onPeers)
    this.releasePeerListeners = () => {
      provider.off("status", onStatus)
      provider.off("peers", onPeers)
    }
  }

  private pausePeer(status: EditorNativeWebrtcStatus) {
    this.releasePeerListeners?.()
    this.releasePeerListeners = undefined
    this.peerProvider?.disconnect()
    this.peerStatus = this.signalingUrls.length ? status : "disabled"
    this.reportedWebrtcPeers = 0
    this.reportedBroadcastChannelPeers = 0
  }

  private onDocumentUpdate(update: Uint8Array, cause: unknown) {
    if (cause === this || cause === this.serverProvider) return

    if (!this.sessionStateApplied || !this.isWritable()) {
      this.preserveLocalDraft()

      return
    }

    const copy = update.slice()

    for (const listener of this.listeners.update) listener(copy)

    const serverDocument = this.serverDocument

    if (serverDocument) Y.applyUpdate(serverDocument, update, this)
  }

  private isWritable() {
    return (
      !this.destroyed &&
      !this.terminalStatus &&
      this.status === "connected" &&
      this.permissionValue === "write" &&
      this.serverAuthenticated &&
      this.serverSynced &&
      this.sessionStateApplied &&
      this.currentGrant !== undefined &&
      this.currentGrant.credentialExpiresAt > Date.now()
    )
  }

  private getNativePeerStatus(): EditorNativeWebrtcStatus {
    if (!this.signalingUrls.length) return "disabled"

    return this.peerStatus
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
      writable: this.isWritable(),
      peers,
    }
    this.nativeSnapshot = {
      hocuspocus: {
        status: this.socketStatus,
        authenticated: this.serverAuthenticated,
        synced: this.serverSynced,
        unsyncedChanges: this.nativeSnapshot.hocuspocus.unsyncedChanges,
      },
      webrtc: {
        status: this.getNativePeerStatus(),
        reportedWebrtcPeers: this.reportedWebrtcPeers,
        reportedBroadcastChannelPeers: this.reportedBroadcastChannelPeers,
      },
    }
    this.publishSubscribers()
  }

  private publishSubscribers() {
    for (const subscriber of this.subscribers) subscriber()
  }

  private setStatus(status: EditorCollaborationConnectionStatus) {
    if (this.status === status) {
      this.publish()

      return
    }

    this.status = status
    this.publish()
    this.emit("sync", status === "connected")
    this.emit("status", { status })
  }

  private emit<Key extends keyof ProviderEvents>(
    type: Key,
    value: ProviderEvents[Key],
  ) {
    for (const listener of this.listeners[type]) listener(value)
  }

  private isCurrent(epoch: number) {
    return (
      !this.destroyed &&
      this.epoch === epoch &&
      !this.manualDisconnect &&
      this.terminalStatus === undefined
    )
  }

  private isCurrentGrant(
    grant: ReturnType<typeof validateEditorNativeRoomGrant>,
    epoch: number,
    cycle: number,
  ) {
    return (
      this.isCurrent(epoch) &&
      this.authCycle === cycle &&
      this.currentGrant === grant &&
      this.status === "connected"
    )
  }

  private settleReady(epoch: number, error?: Error) {
    const waiter = this.readyWaiter

    if (!waiter || waiter.epoch !== epoch) return
    clearTimeout(waiter.timer)
    this.readyWaiter = undefined

    if (error) waiter.reject(error)
    else waiter.resolve()
  }

  private fail(status: EditorCollaborationConnectionStatus) {
    if (this.destroyed || this.terminalStatus === "conflict") return
    this.terminalStatus = status
    this.stop(status, new Error("native collaboration connection failed"))
  }

  private stop(status: EditorCollaborationConnectionStatus, error?: Error) {
    this.manualDisconnect = status === "disconnected"
    this.epoch++
    const epoch = this.epoch
    this.grantController?.abort()
    this.grantController = undefined
    this.authorizationPromise = undefined
    this.currentGrant = undefined
    clearTimeout(this.expiryTimer)
    this.expiryTimer = undefined
    this.serverAuthenticated = false
    this.serverSynced = false
    this.sessionStateApplied = false
    this.permissionValue = "read"
    this.socketStatus = "disconnected"
    this.pausePeer(
      status === "connecting" ||
        status === "reconnecting" ||
        status === "syncing"
        ? "waiting"
        : "stopped",
    )
    this.websocket?.disconnect()
    this.clearRemoteAwareness()
    this.setStatus(status)
    this.settleReady(
      epoch - 1,
      error ?? new Error("native collaboration disconnected"),
    )
  }

  private clearRemoteAwareness() {
    const clients = [...this.awarenessDoc.getStates().keys()].filter(
      (clientId) => clientId !== this.awarenessDoc.clientID,
    )

    if (clients.length) removeAwarenessStates(this.awarenessDoc, clients, this)
  }

  private destroyServerResources(
    provider: HocuspocusProvider | undefined,
    websocket: HocuspocusProviderWebsocket | undefined,
    serverDocument: Y.Doc | undefined,
  ) {
    provider?.destroy()
    websocket?.destroy()
    serverDocument?.destroy()

    if (!provider) this.awarenessDoc.destroy()
    this.doc.destroy()
  }
}

export function createEditorNativeCollaboration(
  options: EditorNativeCollaborationOptions,
) {
  return new EditorNativeCollaborationProvider(options)
}
