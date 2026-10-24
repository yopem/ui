import type { EditorCollaborationHttpOptions } from "@editor/server/collaboration-http"

import { createEditorCollaborationInitializer } from "@editor/server/collaboration-initialize"
import { createPostgresCollaborationLog } from "@editor/server/collaboration-postgres"
import { createPostgresEditorCollaborationSessions } from "@editor/server/collaboration-session"
import { createPostgresCollaborationTicketStore } from "@editor/server/collaboration-tickets"
import { PGlite } from "@electric-sql/pglite"
import { buildEditorFromExtensions } from "@lexical/extension"
import { HeadlessExtension } from "@lexical/headless"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import * as Y from "yjs"
import { z } from "zod"

export const nativeOrigin = "https://editor.test"

export const nativeDocumentId = "native:document"

export const nativeGeneration = "a".repeat(64)

export interface NativeCollaborationStatus {
  ticketCount: number
  clientCount: number
  updateCount: number
  revision: string
}

export interface NativeRevalidationGate {
  started: Promise<void>
  aborted: Promise<void>
  release(value: boolean): void
}

export interface NativeCollaborationFixture {
  options: Omit<EditorCollaborationHttpOptions, "upgrade">
  generation: string
  ticketHeaders(
    permission: "read" | "write",
    overrides?: Record<string, string>,
  ): Record<string, string>
  setWriteAllowed(allowed: boolean): void
  blockNextRevalidation(): NativeRevalidationGate
  status(): Promise<NativeCollaborationStatus>
  close(): Promise<void>
}

interface Deferred<Value> {
  promise: Promise<Value>
  resolve(value: Value): void
}

interface NativeRevalidationGateState {
  started: Deferred<void>
  aborted: Deferred<void>
  decision: Deferred<boolean>
  release(value: boolean): void
}

function deferred<Value>(): Deferred<Value> {
  let resolvePromise: ((value: Value) => void) | undefined

  const promise = new Promise<Value>((resolve) => {
    resolvePromise = resolve
  })

  return {
    promise,
    resolve(value: Value) {
      if (!resolvePromise) throw new Error("deferred promise is not ready")
      resolvePromise(value)
    },
  }
}

async function applyMigration(db: PGlite, path: string) {
  await db.exec(await readFile(join(process.cwd(), path), "utf8"))
}

function createInitializer() {
  return createEditorCollaborationInitializer({
    createEditor() {
      return buildEditorFromExtensions(HeadlessExtension, {
        name: "collaboration/native-test",
        namespace: "collaboration-native-test",
      })
    },
    validateState(state) {
      return z
        .object({ root: z.object({ type: z.literal("root") }) })
        .safeParse(state).success
    },
  })
}

export async function createNativeCollaborationFixture(): Promise<NativeCollaborationFixture> {
  const db = new PGlite()
  await applyMigration(
    db,
    "packages/editor/src/server/migrations/postgres/0001-document-snapshots.sql",
  )
  await applyMigration(
    db,
    "packages/editor/src/server/collaboration/0002-collaboration.sql",
  )
  await applyMigration(
    db,
    "packages/editor/src/server/collaboration/0003-collaboration-runtime.sql",
  )
  await db.query(
    "INSERT INTO editor_documents VALUES($1,$2,1,'snapshot',$3,1,0,$4)",
    [
      nativeDocumentId,
      nativeGeneration,
      '{"root":{"type":"root","children":[]}}',
      "b".repeat(64),
    ],
  )
  await db.query("INSERT INTO editor_generations VALUES($1,$2)", [
    nativeGeneration,
    nativeDocumentId,
  ])

  const transactions = {
    async run<T>(
      signal: AbortSignal,
      deadline: number,
      work: (
        query: (
          text: string,
          values: (string | Uint8Array)[],
        ) => Promise<unknown[]>,
      ) => Promise<T>,
    ) {
      return await db.transaction(async (tx) => {
        const result = await work(async (text, values) => {
          signal.throwIfAborted()

          if (Date.now() >= deadline) throw new Error("deadline")

          return (await tx.query(text, values)).rows
        })

        signal.throwIfAborted()

        if (Date.now() >= deadline) throw new Error("deadline")

        return result
      })
    },
  }

  let writeAllowed = true

  function policyDecision(input: {
    documentId: string
    identity: { userId: string }
    action: string
  }) {
    return (
      input.documentId === nativeDocumentId &&
      input.identity.userId === "native-user" &&
      ((input.action !== "collab:write" && input.action !== "document:write") ||
        writeAllowed)
    )
  }

  const log = createPostgresCollaborationLog({
    transactions,
    timeoutMs: 5000,
    maxConcurrent: 8,
    policy(input) {
      return Promise.resolve(policyDecision(input))
    },
  })

  const seed = new Y.Doc()
  seed.getText("content").insert(0, "saved")
  const seedState = Y.encodeStateAsUpdate(seed)
  seed.destroy()
  const credentialExpiresAt = Date.now() + 300000

  await log.initialize(
    {
      documentId: nativeDocumentId,
      generation: nativeGeneration,
      revision: "1",
      initialize() {
        return Promise.resolve(seedState)
      },
    },
    {
      identity: { provider: "openauth", userId: "native-user" },
      credentialExpiresAt,
      signal: new AbortController().signal,
      deadline: Date.now() + 10000,
    },
  )

  const tickets = createPostgresCollaborationTicketStore({
    transactions,
    timeoutMs: 5000,
  })

  const accessToken = crypto.randomUUID()
  const csrfToken = crypto.randomUUID()
  let nextRevalidation: NativeRevalidationGateState | undefined

  function revalidate(input: {
    permission: "read" | "write"
    credentialExpiresAt: number
    signal: AbortSignal
  }) {
    const gate = nextRevalidation

    const allowed =
      !input.signal.aborted &&
      input.credentialExpiresAt > Date.now() &&
      (input.permission !== "write" || writeAllowed)

    if (!gate) return Promise.resolve(allowed)
    nextRevalidation = undefined
    gate.started.resolve()

    const abort = function abortRevalidation() {
      gate.aborted.resolve()
      gate.decision.resolve(false)
    }

    input.signal.addEventListener("abort", abort, { once: true })

    if (input.signal.aborted) abort()

    return gate.decision.promise
      .then((decision) => decision && allowed)
      .finally(function removeAbortListener() {
        input.signal.removeEventListener("abort", abort)
      })
  }

  const sessions = createPostgresEditorCollaborationSessions({
    log,
    tickets,
    transactions,
    timeoutMs: 5000,
    pollIntervalMs: 25,
    revalidate,
  })

  const options: Omit<EditorCollaborationHttpOptions, "upgrade"> = {
    origin: nativeOrigin,
    basePath: "/collaboration/",
    timeoutMs: 5000,
    authenticate(request) {
      if (request.headers.get("Authorization") !== `Bearer ${accessToken}`)
        return Promise.resolve({ status: "unauthenticated" })

      return Promise.resolve({
        status: "authenticated",
        identity: { provider: "openauth", userId: "native-user" },
        credentialExpiresAt,
      })
    },
    policy(input) {
      return Promise.resolve(policyDecision(input))
    },
    verifyCsrf(input) {
      return Promise.resolve(
        !input.signal.aborted &&
          input.request.headers.get("Origin") === nativeOrigin &&
          input.token === csrfToken,
      )
    },
    revalidate,
    transactions,
    log,
    tickets,
    sessions,
    initialize: createInitializer(),
  }

  async function count(
    table:
      | "editor_collaboration_tickets"
      | "editor_collaboration_clients"
      | "editor_collaboration_updates",
  ) {
    const result = await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM ${table}`,
    )

    return Number(
      z
        .strictObject({ count: z.string().regex(/^[0-9]+$/) })
        .parse(result.rows[0]).count,
    )
  }

  return {
    options,
    generation: nativeGeneration,
    ticketHeaders(
      permission: "read" | "write",
      overrides: Record<string, string> = {},
    ) {
      return {
        Origin: nativeOrigin,
        Authorization: `Bearer ${accessToken}`,
        "X-CSRF-Token": csrfToken,
        "X-Editor-Permission": permission,
        ...overrides,
      }
    },
    setWriteAllowed(allowed: boolean) {
      writeAllowed = allowed
    },
    blockNextRevalidation() {
      if (nextRevalidation) throw new Error("revalidation is already blocked")

      const gate: NativeRevalidationGateState = {
        started: deferred<void>(),
        aborted: deferred<void>(),
        decision: deferred<boolean>(),
        release(value: boolean) {
          gate.decision.resolve(value)
        },
      }

      nextRevalidation = gate

      return {
        started: gate.started.promise,
        aborted: gate.aborted.promise,
        release(value: boolean) {
          gate.release(value)
        },
      }
    },
    async status(): Promise<NativeCollaborationStatus> {
      const [ticketCount, clientCount, updateCount, result] = await Promise.all(
        [
          count("editor_collaboration_tickets"),
          count("editor_collaboration_clients"),
          count("editor_collaboration_updates"),
          db.query<{ revision: string }>(
            "SELECT revision::text AS revision FROM editor_documents WHERE document_id=$1",
            [nativeDocumentId],
          ),
        ],
      )

      const revision = z
        .strictObject({ revision: z.string().regex(/^[1-9][0-9]*$/) })
        .parse(result.rows[0]).revision

      return { ticketCount, clientCount, updateCount, revision }
    },
    async close() {
      nextRevalidation?.release(false)
      await db.close()
    },
  }
}
