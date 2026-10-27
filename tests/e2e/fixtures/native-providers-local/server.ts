import type { Duplex } from "node:stream"

import { createEditorCollaborationInitializer } from "@editor/server/collaboration-initialize"
import {
  createEditorNativeGrantsHttpHandler,
  type EditorNativeRoomGrantProvision,
} from "@editor/server/collaboration-native-grants"
import { Server as HocuspocusServer } from "@hocuspocus/server"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical"
import { randomBytes, timingSafeEqual } from "node:crypto"
import {
  createServer as createHttpServer,
  request as requestHttp,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http"
import { createServer as createHttpsServer } from "node:https"
import { connect as connectTcp, type Socket } from "node:net"
import { WebSocket, WebSocketServer, type RawData } from "ws"
import * as Y from "yjs"
import { z } from "zod"

const fixturePort = 3443

const docsPort = 3100

const origin = `https://127.0.0.1:${fixturePort}`

const grantPath = "/api/native-grant"

const socketPath = "/native-collaboration/socket"

const signalingPath = "/signaling"

const sharedRoomId = "native:local-shared"

const switchRoomId = "native:local-switch"

const deniedRoomId = "native:local-denied"

const pendingRoomId = "native:local-pending"

const credentialLifetimeMs = 900_000

const gatewayConnectionLimit = 64

const gatewayRequestLimit = 32

const signalingConnectionLimit = 16

const signalingTopicLimit = 32

const signalingMessageLimit = 65_536

const grantBodyLimit = 16_384

const tcpAddressSchema = z.object({
  port: z.number().int().nonnegative(),
})

const signalingMessageSchema = z.looseObject({
  type: z.enum(["subscribe", "unsubscribe", "publish", "ping"]),
  topics: z.array(z.string().min(1).max(256)).max(8).optional(),
  topic: z.string().min(1).max(256).optional(),
})

type SignalingMessage = z.infer<typeof signalingMessageSchema>

type SignalingResponse =
  | { type: "pong" }
  | (SignalingMessage & { clients: number })

interface NativeProviderEnvironment extends Record<string, string> {
  RUN_EDITOR_NATIVE_PROVIDERS: "1"
  EDITOR_NATIVE_DOCS_URL: string
  EDITOR_NATIVE_GRANT_URL: string
  EDITOR_NATIVE_SOCKET_URL: string
  EDITOR_NATIVE_SIGNALING_URLS: string
  EDITOR_NATIVE_ROOM_ID: string
  EDITOR_NATIVE_SWITCH_ROOM_ID: string
  EDITOR_NATIVE_DENIED_ROOM_ID: string
  EDITOR_NATIVE_PENDING_ROOM_ID: string
}

interface FixtureIdentity {
  name: "writerA" | "writerB" | "reader" | "denied"
  envName: "WRITER_A" | "WRITER_B" | "READER" | "DENIED"
  userId: string
  cookieName: string
  cookieValue: string
  csrf: string
  credentialExpiresAt: number
}

interface NativeRoom {
  generation: string
  seeded: true
  update: Uint8Array
  peerRoom: string
  peerPassword: string
}

interface HocuspocusCredential {
  roomId: string
  generation: string
  userId: string
  permission: "read" | "write"
  credentialExpiresAt: number
  readOnly: boolean
}

interface HocuspocusContext {
  roomId: string
  generation: string
  identity: { provider: "openauth"; userId: string }
  permission: "read" | "write"
  credentialExpiresAt: number
}

export interface NativeProviderFixture {
  environment: NativeProviderEnvironment
  close(): Promise<void>
}

function randomSecret() {
  return randomBytes(32).toString("base64url")
}

function createIdentities(): FixtureIdentity[] {
  const credentialExpiresAt = Date.now() + credentialLifetimeMs

  return [
    {
      name: "writerA",
      envName: "WRITER_A",
      userId: "native-writer-a",
      cookieName: "__Host-native-writer-a",
      cookieValue: randomSecret(),
      csrf: randomSecret(),
      credentialExpiresAt,
    },
    {
      name: "writerB",
      envName: "WRITER_B",
      userId: "native-writer-b",
      cookieName: "__Host-native-writer-b",
      cookieValue: randomSecret(),
      csrf: randomSecret(),
      credentialExpiresAt,
    },
    {
      name: "reader",
      envName: "READER",
      userId: "native-reader",
      cookieName: "__Host-native-reader",
      cookieValue: randomSecret(),
      csrf: randomSecret(),
      credentialExpiresAt,
    },
    {
      name: "denied",
      envName: "DENIED",
      userId: "native-denied",
      cookieName: "__Host-native-denied",
      cookieValue: randomSecret(),
      csrf: randomSecret(),
      credentialExpiresAt,
    },
  ]
}

function secretMatches(left: string, right: string) {
  const leftBytes = Buffer.from(left)
  const rightBytes = Buffer.from(right)

  return (
    leftBytes.byteLength === rightBytes.byteLength &&
    timingSafeEqual(leftBytes, rightBytes)
  )
}

function readCookieValue(header: string | null, cookieName: string) {
  if (!header) return undefined
  let value: string | undefined

  for (const part of header.split(";")) {
    const separator = part.indexOf("=")

    if (separator < 1 || part.slice(0, separator).trim() !== cookieName)
      continue

    if (value !== undefined) return undefined
    value = part.slice(separator + 1).trim()
  }

  return value
}

function findIdentityByCookie(
  header: string | null,
  identities: readonly FixtureIdentity[],
) {
  for (const identity of identities) {
    const cookie = readCookieValue(header, identity.cookieName)

    if (cookie && secretMatches(cookie, identity.cookieValue)) return identity
  }

  return undefined
}

function isRoomMember(identity: FixtureIdentity, roomId: string) {
  if (roomId === sharedRoomId)
    return (
      identity.name === "writerA" ||
      identity.name === "writerB" ||
      identity.name === "reader"
    )

  if (roomId === switchRoomId) return identity.name === "writerA"

  if (roomId === pendingRoomId) return identity.name === "writerA"

  return false
}

function createCanonicalLexicalState(roomId: string) {
  const editor = buildEditorFromExtensions(HeadlessExtension, {
    name: "collaboration/native-local-acceptance",
    namespace: "collaboration-native-local-acceptance",
  })

  try {
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append(
            $createTextNode(`Authoritative Lexical seed for ${roomId}`),
          ),
        )
      },
      { discrete: true },
    )

    return JSON.stringify(editor.getEditorState().toJSON())
  } finally {
    editor.dispose()
  }
}

async function createSeededRoom(roomId: string): Promise<NativeRoom> {
  const initialize = createEditorCollaborationInitializer({
    createEditor() {
      return buildEditorFromExtensions(HeadlessExtension, {
        name: "collaboration/native-local-acceptance",
        namespace: "collaboration-native-local-acceptance",
      })
    },
    validateState(state, schemaVersion) {
      return (
        schemaVersion === 1 &&
        z
          .object({ root: z.object({ type: z.literal("root") }) })
          .safeParse(state).success
      )
    },
  })

  const generation = randomBytes(32).toString("hex")

  const update = await initialize({
    documentId: roomId,
    state: createCanonicalLexicalState(roomId),
    schemaVersion: 1,
    signal: new AbortController().signal,
  })

  return {
    generation,
    seeded: true,
    update: update.slice(),
    peerRoom: `native:${roomId}:${generation.slice(0, 16)}`,
    peerPassword: randomSecret(),
  }
}

function signalingDataText(data: RawData) {
  if (Array.isArray(data))
    return Promise.resolve(Buffer.concat(data).toString("utf8"))

  if (data instanceof ArrayBuffer)
    return Promise.resolve(Buffer.from(data).toString("utf8"))

  if (data instanceof Blob) return data.text()

  return Promise.resolve(data.toString("utf8"))
}

function parseSignalingMessage(data: RawData, isBinary: boolean) {
  if (isBinary) return Promise.resolve(undefined)

  return signalingDataText(data).then((text) => {
    if (Buffer.byteLength(text) > signalingMessageLimit) return undefined

    const message = signalingMessageSchema.safeParse(JSON.parse(text))

    return message.success ? message.data : undefined
  })
}

function sendSignalingMessage(socket: WebSocket, message: SignalingResponse) {
  if (
    socket.readyState !== WebSocket.CONNECTING &&
    socket.readyState !== WebSocket.OPEN
  ) {
    socket.close()

    return
  }

  try {
    const encoded = JSON.stringify(message)

    if (encoded !== undefined) socket.send(encoded)
  } catch {
    socket.close()
  }
}

function waitForListening(server: HttpServer, port: number) {
  return new Promise<number>((resolve, reject) => {
    function onError(error: Error) {
      server.off("error", onError)
      reject(error)
    }

    server.once("error", onError)
    server.listen(port, "127.0.0.1", () => {
      server.off("error", onError)
      const address = tcpAddressSchema.safeParse(server.address())

      if (!address.success) {
        reject(new Error("fixture listener did not report a TCP address"))

        return
      }

      resolve(address.data.port)
    })
  })
}

function waitForClose(server: HttpServer, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("fixture close timed out")),
      timeoutMs,
    )

    server.close((error) => {
      clearTimeout(timer)

      if (error) reject(error)
      else resolve()
    })
  })
}

function startLoopbackSignaler() {
  const topics = new Map<string, Set<WebSocket>>()

  const server = createHttpServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" })
    response.end("okay")
  })

  const websocketServer = new WebSocketServer({
    noServer: true,
    maxPayload: signalingMessageLimit,
    perMessageDeflate: false,
  })

  server.maxConnections = signalingConnectionLimit
  server.headersTimeout = 30_000
  server.requestTimeout = 30_000
  server.keepAliveTimeout = 5000

  websocketServer.on("connection", (socket) => {
    if (websocketServer.clients.size > signalingConnectionLimit) {
      socket.close(1013, "connection limit")

      return
    }

    const subscriptions = new Set<string>()
    let closed = false
    let pongReceived = true

    const pingTimer = setInterval(() => {
      if (!pongReceived) {
        socket.close()
        clearInterval(pingTimer)
      } else {
        pongReceived = false

        try {
          socket.ping()
        } catch {
          socket.close()
        }
      }
    }, 30_000)

    pingTimer.unref()

    socket.on("pong", () => {
      pongReceived = true
    })
    socket.on("close", () => {
      clearInterval(pingTimer)

      for (const topic of subscriptions) {
        const subscribers = topics.get(topic)

        if (!subscribers) continue
        subscribers.delete(socket)

        if (!subscribers.size) topics.delete(topic)
      }

      subscriptions.clear()
      closed = true
    })
    socket.on("message", (data, isBinary) => {
      void parseSignalingMessage(data, isBinary)
        .then((message) => {
          if (!message || closed) {
            socket.close(1007, "invalid signaling message")

            return
          }

          if (message.type === "subscribe") {
            for (const topic of message.topics ?? []) {
              let subscribers = topics.get(topic)

              if (!subscribers) {
                if (topics.size >= signalingTopicLimit) {
                  socket.close(1013, "topic limit")

                  return
                }

                subscribers = new Set()
                topics.set(topic, subscribers)
              }

              subscribers.add(socket)
              subscriptions.add(topic)
            }

            return
          }

          if (message.type === "unsubscribe") {
            for (const topic of message.topics ?? []) {
              const subscribers = topics.get(topic)

              if (!subscribers) continue
              subscribers.delete(socket)
              subscriptions.delete(topic)

              if (!subscribers.size) topics.delete(topic)
            }

            return
          }

          if (message.type === "ping") {
            sendSignalingMessage(socket, { type: "pong" })

            return
          }

          if (!message.topic) return
          const subscribers = topics.get(message.topic)

          if (!subscribers) return

          const payload = { ...message, clients: subscribers.size }

          for (const receiver of subscribers)
            sendSignalingMessage(receiver, payload)
        })
        .catch(() => socket.close(1007, "invalid signaling message"))
    })
  })

  server.on("upgrade", (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request)
    })
  })

  return {
    async start() {
      return await waitForListening(server, 0)
    },
    async close() {
      for (const client of websocketServer.clients) client.terminate()

      const websocketClose = new Promise<void>((resolve, reject) => {
        websocketServer.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })

      const httpClose = waitForClose(server, 3000)
      server.closeAllConnections()
      await Promise.all([websocketClose, httpClose])
    },
  }
}

function copyIncomingHeaders(request: IncomingMessage) {
  const headers = new Headers()

  const forbidden = new Set([
    "connection",
    "content-length",
    "expect",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ])

  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined || forbidden.has(name)) continue
    headers.set(
      name,
      Array.isArray(value)
        ? value.join(name === "cookie" ? "; " : ", ")
        : value,
    )
  }

  return headers
}

function readIncomingBody(request: IncomingMessage) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Uint8Array[] = []
    let size = 0

    request.on("data", (chunk: Buffer | string) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += bytes.byteLength

      if (size > grantBodyLimit) {
        reject(new Error("grant request body limit exceeded"))
        request.destroy()

        return
      }

      chunks.push(new Uint8Array(bytes))
    })
    request.once("end", () => {
      const body = new Uint8Array(size)
      let offset = 0

      for (const chunk of chunks) {
        body.set(chunk, offset)
        offset += chunk.byteLength
      }

      resolve(body)
    })
    request.once("error", reject)
    request.once("aborted", () => reject(new Error("grant request aborted")))
  })
}

function respondError(response: ServerResponse, status: number) {
  if (response.destroyed || response.headersSent) return
  response.writeHead(status, {
    "Content-Length": "0",
    "Cache-Control": "no-store",
  })
  response.end()
}

function createGatewayRequest(
  request: IncomingMessage,
  body: Uint8Array | undefined,
  signal: AbortSignal,
) {
  const requestUrl = new URL(request.url ?? "/", origin)
  const headers = copyIncomingHeaders(request)

  if (request.method === "POST" && body !== undefined)
    return new Request(requestUrl, {
      method: request.method,
      headers,
      body: new Uint8Array(body),
      signal,
    })

  return new Request(requestUrl, { method: request.method, headers, signal })
}

function createRawUpgradeRequest(request: IncomingMessage, targetPort: number) {
  const path = request.url ?? "/"
  const lines = [`Host: 127.0.0.1:${targetPort}`]

  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    const name = request.rawHeaders[index]
    const value = request.rawHeaders[index + 1]

    if (name.toLowerCase() !== "host") lines.push(`${name}: ${value}`)
  }

  return `${request.method ?? "GET"} ${path} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n`
}

function startHttpsGateway(
  certificate: Buffer,
  privateKey: Buffer,
  signalerPort: number,
  grantHandler: (request: Request) => Promise<Response>,
  hocuspocusPort: number,
) {
  const sockets = new Set<Duplex>()
  let activeHttp = 0
  let activeUpgrades = 0
  const server = createHttpsServer({ cert: certificate, key: privateKey })
  server.maxConnections = gatewayConnectionLimit
  server.headersTimeout = 30_000
  server.requestTimeout = 30_000
  server.keepAliveTimeout = 5000

  server.on("connection", (socket: Socket) => {
    sockets.add(socket)
    socket.once("close", () => sockets.delete(socket))

    if (sockets.size > gatewayConnectionLimit) socket.destroy()
  })

  server.on("request", (request, response) => {
    if (request.headers.host !== `127.0.0.1:${fixturePort}`) {
      respondError(response, 421)

      return
    }

    if (activeHttp >= gatewayRequestLimit) {
      respondError(response, 503)

      return
    }

    activeHttp++
    let released = false

    const release = () => {
      if (released) return
      released = true
      activeHttp--
    }

    response.once("finish", release)
    response.once("close", release)

    let pathname: string

    try {
      pathname = new URL(request.url ?? "/", origin).pathname
    } catch {
      respondError(response, 400)
      release()

      return
    }

    if (pathname === grantPath) {
      void (async () => {
        const controller = new AbortController()
        const abort = () => controller.abort()
        request.once("aborted", abort)
        response.once("close", () => {
          if (!response.writableEnded) abort()
        })

        try {
          const body =
            request.method === "POST"
              ? await readIncomingBody(request)
              : undefined

          const grantRequest = createGatewayRequest(
            request,
            body,
            controller.signal,
          )

          const grantResponse = await grantHandler(grantRequest)

          if (controller.signal.aborted || response.destroyed) return

          const bytes = new Uint8Array(await grantResponse.arrayBuffer())

          if (bytes.byteLength > grantBodyLimit) {
            respondError(response, 502)

            return
          }

          response.statusCode = grantResponse.status

          for (const [name, value] of grantResponse.headers)
            response.setHeader(name, value)

          response.end(Buffer.from(bytes))
        } catch {
          if (!response.destroyed) respondError(response, 413)
        } finally {
          request.off("aborted", abort)
        }
      })()

      return
    }

    const upstream = requestHttp({
      hostname: "127.0.0.1",
      port: docsPort,
      method: request.method,
      path: request.url,
      agent: false,
      headers: {
        ...request.headers,
        host: request.headers.host,
        "x-forwarded-host": request.headers.host,
        "x-forwarded-proto": "https",
      },
    })

    upstream.once("response", (upstreamResponse) => {
      response.statusCode = upstreamResponse.statusCode ?? 502

      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value !== undefined) response.setHeader(name, value)
      }

      upstreamResponse.once("error", () => {
        if (!response.destroyed) response.destroy()
      })
      upstreamResponse.pipe(response)
    })
    upstream.once("error", () => respondError(response, 502))
    response.once("close", () => {
      if (!response.writableEnded) upstream.destroy()
    })
    request.once("error", () => upstream.destroy())
    request.pipe(upstream)
  })

  server.on("upgrade", (request, clientSocket, head) => {
    if (request.headers.host !== `127.0.0.1:${fixturePort}`) {
      clientSocket.end(
        "HTTP/1.1 421 Misdirected Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      )

      return
    }

    let pathname: string

    try {
      pathname = new URL(request.url ?? "/", origin).pathname
    } catch {
      clientSocket.end(
        "HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      )

      return
    }

    let targetPort: number | undefined

    if (pathname === socketPath) targetPort = hocuspocusPort
    else if (pathname === signalingPath) targetPort = signalerPort

    if (targetPort === undefined || activeUpgrades >= gatewayRequestLimit) {
      clientSocket.end(
        "HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
      )

      return
    }

    activeUpgrades++
    const upstreamSocket = connectTcp(targetPort, "127.0.0.1")
    sockets.add(clientSocket)
    sockets.add(upstreamSocket)
    let released = false

    const release = () => {
      if (released) return
      released = true
      activeUpgrades--
      sockets.delete(clientSocket)
      sockets.delete(upstreamSocket)
    }

    const handshakeTimer = setTimeout(() => {
      clientSocket.destroy()
      upstreamSocket.destroy()
    }, 5000)

    clientSocket.once("close", () => {
      clearTimeout(handshakeTimer)
      release()
      upstreamSocket.destroy()
    })
    upstreamSocket.once("close", () => {
      clearTimeout(handshakeTimer)
      release()
      clientSocket.destroy()
    })
    upstreamSocket.once("error", () => clientSocket.destroy())
    upstreamSocket.once("data", () => clearTimeout(handshakeTimer))
    upstreamSocket.once("connect", () => {
      upstreamSocket.write(createRawUpgradeRequest(request, targetPort))

      if (head.byteLength) upstreamSocket.write(head)

      clientSocket.pipe(upstreamSocket)
      upstreamSocket.pipe(clientSocket)
    })
  })

  return {
    async start() {
      await waitForListening(server, fixturePort)
    },
    async close() {
      const closed = waitForClose(server, 3000)
      server.closeAllConnections()

      for (const socket of sockets) socket.destroy()

      await closed
    },
  }
}

async function waitForAbort(
  signal: AbortSignal,
  deadline: number,
): Promise<never> {
  return await new Promise<never>((_resolve, reject) => {
    const timer = setTimeout(finish, Math.max(1, deadline - Date.now()))

    function finish() {
      clearTimeout(timer)
      signal.removeEventListener("abort", finish)
      reject(new Error("pending local grant ended"))
    }

    if (signal.aborted) {
      finish()

      return
    }

    signal.addEventListener("abort", finish, { once: true })
  })
}

function startHocuspocus(
  rooms: Map<string, NativeRoom>,
  identitiesByUserId: Map<string, FixtureIdentity>,
  issuedCredentials: Map<string, HocuspocusCredential>,
) {
  const server = new HocuspocusServer<HocuspocusContext>({
    address: "127.0.0.1",
    port: 0,
    quiet: true,
    stopOnSignals: false,
    debounce: 0,
    maxDebounce: 0,
    unloadImmediately: true,
    maxPendingDocuments: 4,
    maxUnauthenticatedQueueSize: 65_536,
    maxUnauthenticatedQueueMessages: 32,
    websocketOptions: { maxPayload: 65_536, perMessageDeflate: false },
    onAuthenticate({ documentName, token, connectionConfig }) {
      const credential = issuedCredentials.get(token)
      const room = rooms.get(documentName)

      const identity = credential
        ? identitiesByUserId.get(credential.userId)
        : undefined

      if (
        !credential ||
        !room ||
        !identity ||
        credential.roomId !== documentName ||
        credential.generation !== room.generation ||
        credential.credentialExpiresAt <= Date.now() ||
        !isRoomMember(identity, documentName) ||
        credential.readOnly !==
          (credential.permission === "read" || identity.name === "reader")
      )
        return Promise.reject(new Error("native Hocuspocus grant rejected"))

      connectionConfig.readOnly = credential.readOnly

      return Promise.resolve({
        roomId: credential.roomId,
        generation: credential.generation,
        identity: { provider: "openauth", userId: credential.userId },
        permission: credential.permission,
        credentialExpiresAt: credential.credentialExpiresAt,
      })
    },
    onLoadDocument({ documentName }) {
      const room = rooms.get(documentName)

      if (!room?.seeded)
        return Promise.reject(new Error("native room is not seeded"))

      return Promise.resolve(room.update.slice())
    },
    onStoreDocument({ document, documentName }) {
      const room = rooms.get(documentName)

      if (!room?.seeded)
        return Promise.reject(new Error("native room is not seeded"))

      room.update = Y.encodeStateAsUpdate(document)

      return Promise.resolve()
    },
  })

  server.httpServer.maxConnections = 16
  server.httpServer.headersTimeout = 30_000
  server.httpServer.requestTimeout = 30_000
  server.httpServer.keepAliveTimeout = 5000

  return {
    async start() {
      await server.listen()
      const address = tcpAddressSchema.safeParse(server.httpServer.address())

      if (!address.success)
        throw new Error("Hocuspocus listener did not report a TCP address")

      return address.data.port
    },
    async close() {
      const destroying = server.destroy()

      try {
        await withTimeout(destroying, 5000)
      } catch {
        server.httpServer.closeAllConnections()
        await withTimeout(destroying, 1000)
      }

      server.httpServer.closeAllConnections()
    },
  }
}

async function withTimeout<Value>(promise: Promise<Value>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("fixture operation timed out")),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function startNativeProviderFixture(
  certificate: Buffer,
  privateKey: Buffer,
): Promise<NativeProviderFixture> {
  const identities = createIdentities()

  const identitiesByUserId = new Map(
    identities.map((identity) => [identity.userId, identity]),
  )

  const rooms = new Map<string, NativeRoom>()

  for (const roomId of [sharedRoomId, switchRoomId])
    rooms.set(roomId, await createSeededRoom(roomId))

  const issuedCredentials = new Map<string, HocuspocusCredential>()

  const grantHandler = createEditorNativeGrantsHttpHandler({
    origin,
    path: grantPath,
    timeoutMs: 15_000,
    maxConcurrent: 4,
    authenticate(request) {
      const identity = findIdentityByCookie(
        request.headers.get("cookie"),
        identities,
      )

      if (!identity || identity.credentialExpiresAt <= Date.now())
        return Promise.resolve({ status: "unauthenticated" as const })

      return Promise.resolve({
        status: "authenticated" as const,
        identity: { provider: "openauth" as const, userId: identity.userId },
        credentialExpiresAt: identity.credentialExpiresAt,
      })
    },
    policy(input) {
      const identity = identitiesByUserId.get(input.identity.userId)

      const canWrite =
        identity?.name === "writerA" || identity?.name === "writerB"

      return Promise.resolve(
        identity !== undefined &&
          isRoomMember(identity, input.documentId) &&
          (input.action === "collab:read" ||
            (input.action === "collab:write" && canWrite)),
      )
    },
    verifyCsrf(input) {
      const identity = identitiesByUserId.get(input.identity.userId)

      return Promise.resolve(
        !input.signal.aborted &&
          identity !== undefined &&
          input.request.headers.get("Origin") === origin &&
          secretMatches(input.token, identity.csrf),
      )
    },
    async provision(input): Promise<EditorNativeRoomGrantProvision> {
      const identity = identitiesByUserId.get(input.identity.userId)

      if (
        !identity ||
        identity.credentialExpiresAt <= Date.now() ||
        input.identity.provider !== "openauth" ||
        !isRoomMember(identity, input.roomId) ||
        (input.permission === "write" &&
          identity.name !== "writerA" &&
          identity.name !== "writerB")
      )
        throw new Error("native local room grant rejected")

      if (input.roomId === pendingRoomId)
        return await waitForAbort(input.signal, input.deadline)

      const room = rooms.get(input.roomId)

      if (!room?.seeded) throw new Error("native local room is not seeded")

      for (const [token, credential] of issuedCredentials) {
        if (credential.credentialExpiresAt <= Date.now())
          issuedCredentials.delete(token)
      }

      if (issuedCredentials.size >= 128)
        throw new Error("native local grant limit reached")

      const credentialExpiresAt = Math.min(
        input.maximumCredentialExpiresAt,
        identity.credentialExpiresAt,
      )

      const readOnly = input.permission === "read" || identity.name === "reader"

      const token = randomSecret()

      const credential: HocuspocusCredential = {
        roomId: input.roomId,
        generation: room.generation,
        userId: identity.userId,
        permission: input.permission,
        credentialExpiresAt,
        readOnly,
      }

      issuedCredentials.set(token, credential)

      const scope = {
        roomId: input.roomId,
        generation: room.generation,
        identity: { provider: "openauth" as const, userId: identity.userId },
        permission: input.permission,
        credentialExpiresAt,
      }

      return {
        roomId: input.roomId,
        generation: room.generation,
        seeded: room.seeded,
        identity: { provider: "openauth", userId: identity.userId },
        permission: input.permission,
        hocuspocus: { token, scope },
        displayName: identity.name,
        cursorColor: identity.name === "writerA" ? "#3156a4" : "#936230",
        peer:
          input.permission !== "write" || identity.name === "reader"
            ? null
            : {
                room: room.peerRoom,
                password: room.peerPassword,
                scope: {
                  ...scope,
                  permission: "write",
                  room: room.peerRoom,
                  trustedWritersOnly: true,
                },
              },
      }
    },
  })

  const hocuspocus = startHocuspocus(
    rooms,
    identitiesByUserId,
    issuedCredentials,
  )

  let hocuspocusPort: number
  let signaler: ReturnType<typeof startLoopbackSignaler> | undefined
  let gateway: ReturnType<typeof startHttpsGateway> | undefined

  try {
    hocuspocusPort = await hocuspocus.start()
    signaler = startLoopbackSignaler()
    const signalerPort = await signaler.start()
    gateway = startHttpsGateway(
      certificate,
      privateKey,
      signalerPort,
      grantHandler,
      hocuspocusPort,
    )
    await gateway.start()
  } catch (error) {
    await gateway?.close().catch(() => undefined)
    await signaler?.close().catch(() => undefined)
    await hocuspocus.close().catch(() => undefined)
    throw error
  }

  const environment: NativeProviderEnvironment = {
    RUN_EDITOR_NATIVE_PROVIDERS: "1",
    EDITOR_NATIVE_DOCS_URL: `${origin}/editor/examples#native-collaboration`,
    EDITOR_NATIVE_GRANT_URL: `${origin}${grantPath}`,
    EDITOR_NATIVE_SOCKET_URL: `wss://127.0.0.1:${fixturePort}${socketPath}`,
    EDITOR_NATIVE_SIGNALING_URLS: `wss://127.0.0.1:${fixturePort}${signalingPath}`,
    EDITOR_NATIVE_ROOM_ID: sharedRoomId,
    EDITOR_NATIVE_SWITCH_ROOM_ID: switchRoomId,
    EDITOR_NATIVE_DENIED_ROOM_ID: deniedRoomId,
    EDITOR_NATIVE_PENDING_ROOM_ID: pendingRoomId,
  }

  for (const identity of identities) {
    environment[`EDITOR_NATIVE_${identity.envName}_COOKIE_NAME`] =
      identity.cookieName
    environment[`EDITOR_NATIVE_${identity.envName}_COOKIE_VALUE`] =
      identity.cookieValue
    environment[`EDITOR_NATIVE_${identity.envName}_CSRF`] = identity.csrf
  }

  let closing: Promise<void> | undefined

  return {
    environment,
    close() {
      closing ??= (async () => {
        const results = await Promise.allSettled([
          gateway?.close(),
          signaler?.close(),
          hocuspocus.close(),
        ])

        if (results.some((result) => result.status === "rejected"))
          throw new Error("native local fixture cleanup failed")
      })()

      return closing
    },
  }
}
