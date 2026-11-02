import type {
  D1Database,
  DurableObjectNamespace,
  DurableObjectState,
  ExportedHandler,
  Request as WorkerRequest,
  Response as WorkerResponse,
  WebSocket,
} from "@cloudflare/workers-types"

import { createBetterAuthAuthentication } from "@editor/server/better-auth"
import { createD1CollaborationCanonical } from "@editor/server/collaboration-d1"
import { EditorCollaborationRoom } from "@editor/server/collaboration-do"
import * as Y from "yjs"
import { z } from "zod"

declare const Response: typeof WorkerResponse

interface Env {
  REVALIDATE_MS: number
  TIMEOUT_MS: number
  DB: D1Database
  ROOMS: DurableObjectNamespace
}

function wait(delay: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delay))
}

export class Room {
  readonly ctx: DurableObjectState
  room: EditorCollaborationRoom
  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx

    let shortCredentialExpiresAt: number | undefined

    const authenticate = createBetterAuthAuthentication({
      async getSession({ headers }) {
        if (headers.get("X-Fixture-Block-Authentication") === "1") {
          let checksum = 0

          for (let index = 0; index < 500000000; index++)
            checksum = (checksum + index) % 10000019
          console.info("fixture-blocked-cpu-checksum", checksum)
          ctx.waitUntil(
            env.DB.prepare(
              "INSERT INTO fixture_events VALUES('authentication-blocked')",
            ).run(),
          )
        }

        const session = await env.DB.prepare(
          "SELECT user_id, expires FROM fixture_sessions WHERE token=?",
        )
          .bind(headers.get("authorization"))
          .first<{ user_id: string; expires: number }>()

        const shortCredential =
          headers.get("X-Fixture-Short-Credential") === "1"

        if (session && shortCredential)
          shortCredentialExpiresAt = Math.min(
            session.expires,
            Date.now() + 15000,
          )

        const expiresAt = shortCredential
          ? shortCredentialExpiresAt
          : session?.expires

        if (!session || expiresAt === undefined) return null

        return {
          user: { id: session.user_id },
          session: { expiresAt: new Date(expiresAt) },
        }
      },
    })

    const canonical = createD1CollaborationCanonical(env.DB)

    async function fault(documentId: string, phase: string) {
      const action = await env.DB.prepare(
        "SELECT action FROM fixture_faults WHERE document_id=? AND phase=?",
      )
        .bind(documentId, phase)
        .first<{ action: string }>()

      if (!action) return
      await env.DB.prepare(
        "DELETE FROM fixture_faults WHERE document_id=? AND phase=?",
      )
        .bind(documentId, phase)
        .run()

      if (action.action === "credential-expiry") {
        const expiresAt = shortCredentialExpiresAt

        if (expiresAt === undefined)
          throw new Error("fixture credential expiry is absent")
        await wait(Math.max(0, expiresAt - Date.now() + 1000))
      }

      if (action.action === "delay") await wait(6000)

      if (action.action.startsWith("revoke:"))
        await env.DB.prepare("DELETE FROM fixture_sessions WHERE token=?")
          .bind(action.action.slice(7))
          .run()

      if (action.action === "null-snapshot") return "null-snapshot"

      if (action.action === "throw") throw new Error("fixture lost response")

      if (action?.action === "abort") ctx.abort("fixture actor interruption")

      if (action?.action === "update")
        await env.DB.prepare(
          "UPDATE editor_documents SET revision=revision+1,state_json=? WHERE document_id=?",
        )
          .bind(
            JSON.stringify({
              root: { type: "root", children: [] },
              fixtureText: "new saved",
            }),
            documentId,
          )
          .run()

      if (action?.action === "delete")
        await env.DB.prepare(
          "UPDATE editor_documents SET revision=revision+1,deleted=1,state_json=NULL WHERE document_id=?",
        )
          .bind(documentId)
          .run()

      if (action?.action === "generation")
        await env.DB.prepare(
          "UPDATE editor_documents SET generation=?,revision=1,state_json=? WHERE document_id=?",
        )
          .bind(
            "d".repeat(64),
            JSON.stringify({
              root: { type: "root", children: [] },
              fixtureText: "new generation",
            }),
            documentId,
          )
          .run()
    }

    this.room = new EditorCollaborationRoom(ctx, {
      origin: "https://editor.test",
      basePath: "/collaboration/",
      timeoutMs: env.TIMEOUT_MS,
      revalidateMs: env.REVALIDATE_MS,
      canonical: {
        async read(documentId) {
          const value = await canonical.read(documentId)
          const result = await fault(documentId, "read")

          return value && result === "null-snapshot"
            ? { ...value, state_json: null }
            : value
        },
        async prepare(document, seed, coordinatorId) {
          await canonical.prepare(document, seed, coordinatorId)
          await fault(document.document_id, "prepared")
        },
        async activate(document) {
          await canonical.activate(document)
          await fault(document.document_id, "activated")
        },
      },
      authenticate,
      async policy({ identity, documentId, action, request }) {
        if (request.headers.get("X-Fixture-Block-Authentication") === "1")
          await env.DB.prepare(
            "INSERT INTO fixture_events VALUES('policy-after-deadline')",
          ).run()

        const row = await env.DB.prepare(
          "SELECT permission FROM fixture_permissions WHERE document_id=? AND user_id=?",
        )
          .bind(documentId, identity.userId)
          .first<{ permission: string }>()

        return (
          (action === "collab:write" && row?.permission === "write") ||
          (action === "collab:read" &&
            (row?.permission === "read" || row?.permission === "write"))
        )
      },
      async revalidate({ identity, permission, documentId }) {
        const head = ctx.storage.sql
          .exec<{ revision: number }>("SELECT revision FROM collaboration_head")
          .toArray()[0]

        if (head && head.revision > 0) await fault(documentId, "committed")
        await fault(documentId, "revalidate")

        const row = await env.DB.prepare(
          "SELECT permission FROM fixture_permissions p WHERE document_id=? AND user_id=? AND EXISTS(SELECT 1 FROM fixture_sessions s JOIN fixture_users u ON u.id=s.user_id WHERE s.user_id=p.user_id AND s.expires>?)",
        )
          .bind(documentId, identity.userId, Date.now())
          .first<{ permission: string }>()

        return (
          row?.permission === "write" ||
          (row?.permission === "read" && permission === "read")
        )
      },
      verifyCsrf({ token }) {
        return Promise.resolve(token === "fixture-csrf")
      },
      async initialize({ state, schemaVersion, documentId }) {
        const ignore = await env.DB.prepare(
          "SELECT action FROM fixture_faults WHERE document_id=? AND phase='ignore-snapshot'",
        )
          .bind(documentId)
          .first<{ action: string }>()

        if (ignore) {
          await env.DB.prepare(
            "DELETE FROM fixture_faults WHERE document_id=? AND phase='ignore-snapshot'",
          )
            .bind(documentId)
            .run()
          const doc = new Y.Doc()
          doc.getText("text").insert(0, "ignored")
          const result = Y.encodeStateAsUpdate(doc)
          doc.destroy()

          return result
        }

        const parsed = z
          .object({ fixtureText: z.string().max(1024) })
          .parse(JSON.parse(state))

        if (schemaVersion !== 1) throw new Error("unsupported fixture snapshot")
        const doc = new Y.Doc()
        doc.getText("text").insert(0, parsed.fixtureText)
        const result = Y.encodeStateAsUpdate(doc)
        doc.destroy()
        await fault(documentId, "initialize")

        return result
      },
    })
  }
  async fetch(request: Request) {
    let input =
      request.headers.get("X-Fixture-Aborted-Request") === "1"
        ? new Request(request, { signal: AbortSignal.abort() })
        : request

    if (request.headers.get("X-Fixture-Stalled-Body") === "1")
      input = new Request(input, {
        method: "POST",
        body: new TransformStream<Uint8Array, Uint8Array>().readable,
      })
    const response = await this.room.fetch(input)

    if (
      response.status === 101 &&
      request.headers.get("X-Fixture-Delay-Alarm") === "1"
    )
      await this.ctx.storage.setAlarm(Date.now() + 60000)

    return response
  }
  webSocketMessage(socket: WebSocket, message: ArrayBuffer | string) {
    return this.room.webSocketMessage(socket, message)
  }
  async webSocketClose(socket: WebSocket) {
    const started = Date.now()
    console.info("fixture-close-start", {
      room: this.ctx.id.toString().slice(-6),
      state: socket.readyState,
      at: started,
    })
    await this.room.webSocketClose(socket)
    console.info("fixture-close-end", {
      room: this.ctx.id.toString().slice(-6),
      state: socket.readyState,
      elapsedMs: Date.now() - started,
    })
  }
  webSocketError(socket: WebSocket) {
    return this.room.webSocketClose(socket)
  }
  alarm() {
    return this.room.alarm()
  }
}

export default {
  fetch(request: WorkerRequest, env: Env) {
    const match = /^\/collaboration\/([A-Za-z0-9_:-]+)\/(ticket|socket)$/.exec(
      new URL(request.url).pathname,
    )

    if (!match?.[1]) return new Response(null, { status: 404 })

    return env.ROOMS.getByName(
      request.headers.get("X-Fixture-Room") ?? match[1],
    ).fetch(request)
  },
} satisfies ExportedHandler<Env>
