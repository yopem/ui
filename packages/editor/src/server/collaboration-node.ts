import type { IncomingMessage, ServerResponse } from "node:http"
import type { Duplex } from "node:stream"
import type { RawData } from "ws"

import { Buffer } from "node:buffer"
import { createServer } from "node:http"
import { WebSocket, WebSocketServer } from "ws"

import type {
  EditorCollaborationHttpOptions,
  EditorCollaborationSocket,
  EditorCollaborationSocketCallbacks,
} from "./collaboration-http"

import { createEditorCollaborationHttpHandler } from "./collaboration-http"
import { collaborationLimits } from "./collaboration/protocol"

const queuedBytes = 131072

const queuedMessages = 64

const connectionLimit = 32

export function createNodeEditorCollaborationService(
  options: Omit<EditorCollaborationHttpOptions, "upgrade">,
) {
  const origin = new URL(options.origin)

  if (origin.protocol !== "https:" || origin.origin !== options.origin)
    throw new Error("invalid public origin")
  createEditorCollaborationHttpHandler({
    ...options,
    upgrade() {
      return false
    },
  })
  const sockets = new Set<Duplex>()
  const pending = new Set<AbortController>()
  const cleanups = new Set<Promise<void>>()
  let stopped = false
  let active = 0

  const websocket = new WebSocketServer({
    noServer: true,
    autoPong: false,
    maxPayload: collaborationLimits.frameBytes,
    perMessageDeflate: false,
    handleProtocols(protocols: Set<string>) {
      return protocols.has("editor-v1") ? "editor-v1" : false
    },
  })

  function connect(
    native: WebSocket,
    callbacks: EditorCollaborationSocketCallbacks,
  ) {
    active += 1
    let tail = Promise.resolve()
    let ending = false
    let messages = 0
    let bytes = 0
    let closeTimer: ReturnType<typeof setTimeout> | undefined

    function finish(failed: boolean) {
      if (ending) return
      ending = true
      tail = tail
        .then(async function cleanup() {
          try {
            try {
              if (failed) await callbacks.error(socket)
            } finally {
              await callbacks.close(socket)
            }
          } finally {
            active -= 1
          }
        })
        .catch(function cleanupFailed() {
          native.terminate()
        })
      const cleanup = tail
      cleanups.add(cleanup)
      void cleanup.then(function cleaned() {
        cleanups.delete(cleanup)
      })
    }

    function fail() {
      finish(true)
      native.terminate()
    }

    const socket: EditorCollaborationSocket = {
      get bufferedAmount() {
        return native.bufferedAmount
      },
      send(value) {
        const binary = value instanceof Uint8Array
        const size = binary ? value.byteLength : Buffer.byteLength(value)

        if (
          ending ||
          native.readyState !== WebSocket.OPEN ||
          size > collaborationLimits.frameBytes ||
          native.bufferedAmount + size + 16 > queuedBytes
        ) {
          fail()
          throw new Error("collaboration send unavailable")
        }

        native.send(
          value,
          { binary, compress: false },
          function sent(error?: Error) {
            if (error) fail()
          },
        )
      },
      close(code, reason) {
        if (ending) return
        finish(false)
        native.close(code, reason)
        closeTimer = setTimeout(function terminate() {
          native.terminate()
        }, 1000)
        closeTimer.unref()
      },
    }

    native.on("error", fail)
    native.on("ping", function ping(data: Buffer) {
      if (ending) return

      if (native.bufferedAmount + data.byteLength + 16 > queuedBytes) {
        fail()

        return
      }

      native.pong(data, false, function pong(error?: Error) {
        if (error) fail()
      })
    })
    native.once("close", function closed() {
      clearTimeout(closeTimer)
      finish(false)
    })
    native.on("message", function received(data: RawData, binary: boolean) {
      if (ending) return

      const size = Array.isArray(data)
        ? data.reduce(
            (total: number, part: Buffer) => total + part.byteLength,
            0,
          )
        : data.byteLength

      if (
        size > collaborationLimits.frameBytes ||
        messages >= queuedMessages ||
        bytes + size > queuedBytes
      ) {
        fail()

        return
      }

      const buffer = Array.isArray(data)
        ? Buffer.concat(data, size)
        : data instanceof ArrayBuffer
          ? Buffer.from(data)
          : data

      const value = binary ? buffer : buffer.toString("utf8")

      if (
        !binary &&
        (size > 64 ||
          !/^\s*\{\s*"ack"\s*:\s*"[a-f0-9]{32}"\s*\}\s*$/.test(
            buffer.toString("utf8"),
          ))
      ) {
        fail()

        return
      }

      messages += 1
      bytes += size
      tail = tail
        .then(async function message() {
          try {
            if (!ending) await callbacks.message(socket, value)
          } finally {
            messages -= 1
            bytes -= size
          }
        })
        .catch(fail)
    })
    tail = tail
      .then(async function opened() {
        await callbacks.open(socket)
      })
      .catch(fail)
  }

  function request(input: IncomingMessage, signal: AbortSignal) {
    const target = input.url ?? ""

    if (
      !target.startsWith("/") ||
      target.startsWith("//") ||
      target.includes("\\") ||
      target.includes("#") ||
      input.headers["transfer-encoding"] !== undefined ||
      (input.headers["content-length"] !== undefined &&
        input.headers["content-length"] !== "0")
    )
      throw new Error("invalid request")
    const headers = new Headers()

    for (let index = 0; index < input.rawHeaders.length; index += 2) {
      const name = input.rawHeaders[index]
      const value = input.rawHeaders[index + 1]

      if (name !== undefined && value !== undefined) headers.append(name, value)
    }

    return new Request(`${options.origin}${target}`, {
      method: input.method,
      headers,
      signal,
    })
  }

  async function respond(response: Response, output: ServerResponse) {
    if (output.destroyed) return
    output.statusCode = response.status
    response.headers.forEach(function header(value, name) {
      output.setHeader(name, value)
    })
    const body = Buffer.from(await response.arrayBuffer())

    if (!output.destroyed) output.end(body)
  }

  async function handle(input: IncomingMessage, output: ServerResponse) {
    if (stopped || pending.size >= connectionLimit) {
      output.writeHead(503).end()

      return
    }

    const controller = new AbortController()
    pending.add(controller)

    function abort() {
      controller.abort()
    }

    input.once("aborted", abort)
    output.once("close", abort)

    const timer = setTimeout(function expired() {
      abort()
      output.destroy()
    }, options.timeoutMs)

    try {
      const handler = createEditorCollaborationHttpHandler({
        ...options,
        upgrade() {
          return false
        },
      })

      const response = await handler.fetch(request(input, controller.signal))

      if (!controller.signal.aborted && response)
        await respond(response, output)
    } catch {
      if (!output.destroyed) output.writeHead(400).end()
    } finally {
      clearTimeout(timer)
      pending.delete(controller)
      input.off("aborted", abort)
      output.off("close", abort)
    }
  }

  const server = createServer(function incoming(input, output) {
    void handle(input, output)
  })

  server.maxConnections = connectionLimit * 2
  server.headersTimeout = 30000
  server.requestTimeout = 30000
  server.on("connection", function connected(socket) {
    sockets.add(socket)
    socket.on("error", function socketError() {
      socket.destroy()
    })
    socket.once("close", function disconnected() {
      sockets.delete(socket)
    })
  })
  server.on("upgrade", function upgrade(input, transport, head) {
    if (
      stopped ||
      pending.size >= connectionLimit ||
      active >= connectionLimit ||
      head.byteLength !== 0
    ) {
      transport.destroy()

      return
    }

    const controller = new AbortController()
    pending.add(controller)

    function abort() {
      controller.abort()
    }

    function rejectData() {
      abort()
      transport.destroy()
    }

    transport.once("end", abort)
    transport.once("close", abort)
    transport.once("error", rejectData)
    transport.on("data", rejectData)
    transport.resume()
    const timer = setTimeout(rejectData, options.timeoutMs)

    async function authorize() {
      let upgraded = false

      try {
        const handler = createEditorCollaborationHttpHandler({
          ...options,
          upgrade(execution, _protocol, callbacks) {
            if (
              stopped ||
              execution.signal.aborted ||
              controller.signal.aborted ||
              transport.destroyed ||
              active >= connectionLimit
            )
              return false
            transport.off("data", rejectData)
            websocket.handleUpgrade(
              input,
              transport,
              head,
              function accepted(native: WebSocket) {
                upgraded = true
                connect(native, callbacks)
              },
            )

            return upgraded
          },
        })

        const response = await handler.fetch(request(input, controller.signal))

        if (
          !upgraded &&
          response &&
          !controller.signal.aborted &&
          !transport.destroyed
        ) {
          transport.end(
            `HTTP/1.1 ${response.status} Rejected\r\nConnection: close\r\nContent-Length: 0\r\nCache-Control: no-store\r\n\r\n`,
            function rejected() {
              transport.destroy()
            },
          )
        }
      } catch {
        transport.destroy()
      } finally {
        clearTimeout(timer)
        pending.delete(controller)
        transport.off("end", abort)
        transport.off("close", abort)
        transport.off("error", rejectData)
        transport.off("data", rejectData)

        if (!upgraded && !transport.writableEnded) transport.destroy()
      }
    }

    void authorize()
  })

  async function close() {
    stopped = true

    for (const controller of pending) controller.abort()

    for (const socket of websocket.clients) socket.terminate()

    for (const socket of sockets) socket.destroy()
    await Promise.all([
      new Promise<void>(function closeWebSockets(resolve, reject) {
        websocket.close(function closed(error?: Error) {
          if (error) reject(error)
          else resolve()
        })
      }),
      new Promise<void>(function closeHttp(resolve, reject) {
        server.close(function closed(error) {
          if (error) reject(error)
          else resolve()
        })
      }),
    ])
    await Promise.all(cleanups)
  }

  return { server, close }
}
