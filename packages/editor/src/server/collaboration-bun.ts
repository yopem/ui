import type { Server, ServerWebSocket, WebSocketHandler } from "bun"

import type {
  EditorCollaborationHttpOptions,
  EditorCollaborationSocket,
  EditorCollaborationSocketCallbacks,
} from "./collaboration-http"

import { createEditorCollaborationHttpHandler } from "./collaboration-http"
import { collaborationLimits } from "./collaboration/protocol"

interface BunConnection {
  callbacks: EditorCollaborationSocketCallbacks
  socket?: EditorCollaborationSocket
  tail: Promise<void>
  ending: boolean
  messages: number
  bytes: number
}

const queuedBytes = 131072

const queuedMessages = 64

const connections = 32

export function createBunEditorCollaborationService(
  options: Omit<EditorCollaborationHttpOptions, "upgrade">,
) {
  const origin = new URL(options.origin)
  let pending = 0
  let active = 0

  if (origin.protocol !== "https:" || origin.origin !== options.origin)
    throw new Error("invalid public origin")
  createEditorCollaborationHttpHandler({
    ...options,
    upgrade() {
      return false
    },
  })

  function finish(native: ServerWebSocket<BunConnection>, failed: boolean) {
    const state = native.data
    const socket = state.socket

    if (state.ending) return
    state.ending = true

    if (!socket) {
      active -= 1

      return
    }

    state.tail = state.tail
      .then(async function cleanup() {
        try {
          try {
            if (failed) await state.callbacks.error(socket)
          } finally {
            await state.callbacks.close(socket)
          }
        } finally {
          active -= 1
        }
      })
      .catch(function cleanupFailed() {
        native.terminate()
      })
  }

  function fail(native: ServerWebSocket<BunConnection>) {
    finish(native, true)
    native.terminate()
  }

  const websocket: WebSocketHandler<BunConnection> = {
    maxPayloadLength: collaborationLimits.frameBytes,
    backpressureLimit: queuedBytes,
    closeOnBackpressureLimit: true,
    perMessageDeflate: false,
    idleTimeout: 60,
    open(native) {
      const state = native.data

      if (state.ending) {
        native.terminate()

        return
      }

      const socket: EditorCollaborationSocket = {
        get bufferedAmount() {
          return native.getBufferedAmount()
        },
        send(value) {
          const binary = value instanceof Uint8Array
          const bytes = binary ? value.byteLength : Buffer.byteLength(value)

          if (
            state.ending ||
            native.readyState !== 1 ||
            bytes > collaborationLimits.frameBytes ||
            native.getBufferedAmount() + bytes + 16 > queuedBytes
          ) {
            fail(native)
            throw new Error("collaboration send unavailable")
          }

          const sent = native.send(value)

          if (sent === 0) {
            fail(native)
            throw new Error("collaboration send dropped")
          }
        },
        close(code, reason) {
          if (state.ending) return
          finish(native, false)
          native.close(code, reason)
        },
      }

      state.socket = socket
      state.tail = state.tail
        .then(async function opened() {
          await state.callbacks.open(socket)
        })
        .catch(function openFailed() {
          fail(native)
        })
    },
    message(native, data) {
      const state = native.data
      const socket = state.socket
      const binary = data instanceof Uint8Array
      const bytes = binary ? data.byteLength : Buffer.byteLength(data)

      if (state.ending || !socket) return

      if (
        bytes > collaborationLimits.frameBytes ||
        (!binary &&
          (bytes > 64 ||
            !/^\s*\{\s*"ack"\s*:\s*"[a-f0-9]{32}"\s*\}\s*$/.test(data))) ||
        state.messages >= queuedMessages ||
        state.bytes + bytes > queuedBytes
      ) {
        fail(native)

        return
      }

      state.messages += 1
      state.bytes += bytes
      const value = binary ? new Uint8Array(data) : data
      state.tail = state.tail
        .then(async function received() {
          try {
            if (!state.ending) await state.callbacks.message(socket, value)
          } finally {
            state.messages -= 1
            state.bytes -= bytes
          }
        })
        .catch(function messageFailed() {
          fail(native)
        })
    },
    close(native) {
      finish(native, false)
    },
    error(_error, native) {
      fail(native)
    },
  }

  async function fetch(request: Request, server: Server<BunConnection>) {
    if (request.signal.aborted || pending >= connections)
      return new Response(null, { status: 503 })
    pending += 1

    try {
      const url = new URL(request.url)

      const trusted = new Request(
        `${options.origin}${url.pathname}${url.search}`,
        request,
      )

      const handler = createEditorCollaborationHttpHandler({
        ...options,
        upgrade(_request, protocol, callbacks) {
          if (
            _request.signal.aborted ||
            request.signal.aborted ||
            active >= connections
          )
            return false

          const data: BunConnection = {
            callbacks,
            tail: Promise.resolve(),
            ending: false,
            messages: 0,
            bytes: 0,
          }

          const upgraded = server.upgrade(request, {
            headers: { "Sec-WebSocket-Protocol": protocol },
            data,
          })

          if (upgraded) active += 1

          return upgraded
        },
      })

      return await handler.fetch(trusted)
    } catch {
      return new Response(null, { status: 503 })
    } finally {
      pending -= 1
    }
  }

  return { fetch, websocket }
}
