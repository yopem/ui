import { z } from "zod"

import type { EditorIdentity } from "./auth"

import { candidateState, CollaborationError } from "./collaboration/protocol"
import { boundedState, DocumentError } from "./document-model"

export type CollaborationQuery = (
  text: string,
  values: (string | Uint8Array)[],
) => Promise<unknown[]>

export interface CollaborationTransactions {
  run<T>(
    this: void,
    signal: AbortSignal,
    deadline: number,
    work: (query: CollaborationQuery) => Promise<T>,
  ): Promise<T>
}

export interface CollaborationContext {
  identity: EditorIdentity
  credentialExpiresAt: number
  signal: AbortSignal
  deadline: number
}

export interface CollaborationLogConfig {
  transactions: CollaborationTransactions
  policy(
    this: void,
    input: {
      identity: EditorIdentity
      documentId: string
      action: "collab:read" | "collab:write" | "document:write"
      signal: AbortSignal
    },
  ): Promise<true | false | "unavailable">
  timeoutMs: number
  maxConcurrent: number
}

const identifier = z
  .string()
  .min(3)
  .max(256)
  .regex(/^[A-Za-z0-9][A-Za-z0-9/_:.-]*$/)

const generationSchema = z.string().regex(/^[a-f0-9]{64}$/)

const revisionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine((value) => BigInt(value) <= 9223372036854775807n)

const operation = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/)

const identitySchema = z.object({
  provider: z.enum(["openauth", "better-auth"]),
  userId: z.string().min(1).max(256),
})

const canonicalRow = z.object({
  document_id: identifier,
  generation: generationSchema,
  revision: revisionSchema,
  mode: z.enum(["snapshot", "yjs"]),
  state_json: z.string().nullable(),
  schema_version: z.number().int().positive(),
  deleted: z.number().int().min(0).max(1),
})

const headRow = z.object({
  generation: generationSchema,
  revision: revisionSchema,
  state: z.instanceof(Uint8Array),
})

const updateRow = z.object({
  revision: revisionSchema,
  base_revision: revisionSchema,
  operation_id: operation,
  digest: generationSchema,
  update_bytes: z.instanceof(Uint8Array),
})

const maxRevision = 9223372036854775807n

const emptyState = Uint8Array.of(0, 0)

function expected(generation: string, revision: string) {
  if (
    !generationSchema.safeParse(generation).success ||
    !revisionSchema.safeParse(revision).success
  )
    throw new CollaborationError("invalid")
}

async function digest(bytes: Uint8Array) {
  const value = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes))

  return Array.from(new Uint8Array(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

export function createPostgresCollaborationLog(config: CollaborationLogConfig) {
  if (
    !Number.isSafeInteger(config.timeoutMs) ||
    config.timeoutMs < 1 ||
    config.timeoutMs > 30000 ||
    !Number.isSafeInteger(config.maxConcurrent) ||
    config.maxConcurrent < 1 ||
    config.maxConcurrent > 64 ||
    !z.instanceof(Function).safeParse(config.policy).success ||
    !z.instanceof(Function).safeParse(config.transactions?.run).success
  )
    throw new CollaborationError("invalid")
  let active = 0

  async function execute<T>(
    documentId: string,
    context: CollaborationContext,
    action: "collab:read" | "collab:write" | "document:write",
    mutation: boolean,
    work: (
      query: CollaborationQuery,
      authorize: () => Promise<void>,
      signal: AbortSignal,
      check: () => void,
    ) => Promise<T>,
  ) {
    if (
      !identifier.safeParse(documentId).success ||
      !identitySchema.safeParse(context.identity).success ||
      !Number.isSafeInteger(context.deadline)
    )
      throw new CollaborationError("invalid")

    if (
      !Number.isSafeInteger(context.credentialExpiresAt) ||
      context.credentialExpiresAt <= Date.now()
    )
      throw new CollaborationError("denied")

    if (context.signal.aborted || context.deadline <= Date.now())
      throw new CollaborationError("aborted")

    if (active >= config.maxConcurrent) throw new CollaborationError("budget")
    active++
    const controller = new AbortController()

    const deadline = Math.min(
      context.deadline,
      Date.now() + config.timeoutMs,
      context.credentialExpiresAt,
    )

    let started = false

    function abort() {
      controller.abort()
    }

    context.signal.addEventListener("abort", abort, { once: true })

    if (context.signal.aborted) abort()
    const timer = setTimeout(abort, Math.max(0, deadline - Date.now()))
    const signal = controller.signal

    function check() {
      if (signal.aborted || Date.now() >= deadline)
        throw new CollaborationError("aborted")

      if (Date.now() >= context.credentialExpiresAt)
        throw new CollaborationError("denied")
    }

    async function authorize() {
      check()
      let decision: true | false | "unavailable"

      try {
        decision = await config.policy({
          identity: context.identity,
          documentId,
          action,
          signal,
        })
      } catch {
        throw new CollaborationError("unavailable")
      }

      check()

      if (decision !== true)
        throw new CollaborationError(
          decision === false ? "denied" : "unavailable",
        )
    }

    const pending = (async function runGuarded() {
      await authorize()
      check()
      started = true

      const result = await config.transactions.run(
        signal,
        deadline,
        async function runTransaction(query) {
          async function guardedQuery(
            text: string,
            values: (string | Uint8Array)[],
          ) {
            check()
            const rows = await query(text, values)
            check()

            return rows
          }

          const result = await work(guardedQuery, authorize, signal, check)
          check()

          return result
        },
      )

      check()

      return result
    })().finally(function releaseAdmission() {
      active--
      clearTimeout(timer)
      context.signal.removeEventListener("abort", abort)
    })

    let aborted: (() => void) | undefined

    const interruption = new Promise<never>(function watchAbort(_, reject) {
      aborted = function rejectAborted() {
        reject(
          new CollaborationError(mutation && started ? "uncertain" : "aborted"),
        )
      }

      signal.addEventListener("abort", aborted, { once: true })

      if (signal.aborted) aborted()
    })

    try {
      return await Promise.race([pending, interruption])
    } catch (error) {
      if (error instanceof CollaborationError) {
        if (mutation && started && error.code === "aborted")
          throw new CollaborationError("uncertain")

        throw error
      }

      if (error instanceof z.ZodError) throw new CollaborationError("corrupt")
      throw new CollaborationError(
        mutation && started ? "uncertain" : "unavailable",
      )
    } finally {
      if (aborted) signal.removeEventListener("abort", aborted)
    }
  }

  async function canonical(query: CollaborationQuery, documentId: string) {
    const rows = await query(
      "SELECT document_id,generation,revision::text,mode,state_json,schema_version,deleted FROM editor_documents WHERE document_id=$1 FOR UPDATE",
      [documentId],
    )

    if (rows.length !== 1) throw new CollaborationError("conflict")
    const row = canonicalRow.parse(rows[0])

    if (row.deleted !== 0) throw new CollaborationError("conflict")

    return row
  }

  async function current(query: CollaborationQuery, documentId: string) {
    const doc = await canonical(query, documentId)

    if (doc.mode !== "yjs") throw new CollaborationError("conflict")

    const rows = await query(
      "SELECT generation,revision::text,state FROM editor_collaboration_heads WHERE document_id=$1",
      [documentId],
    )

    if (rows.length !== 1) throw new CollaborationError("corrupt")
    const head = headRow.parse(rows[0])

    if (head.generation !== doc.generation || head.revision !== doc.revision)
      throw new CollaborationError("conflict")

    return head
  }

  return {
    async initialize(
      input: {
        documentId: string
        generation: string
        revision: string
        initialize(snapshot: {
          state: string
          schemaVersion: number
          signal: AbortSignal
        }): Promise<Uint8Array>
      },
      context: CollaborationContext,
    ) {
      expected(input.generation, input.revision)

      return await execute(
        input.documentId,
        context,
        "document:write",
        true,
        async function initializeSnapshot(query, authorize, signal, check) {
          const row = await canonical(query, input.documentId)

          if (
            row.mode !== "snapshot" ||
            row.generation !== input.generation ||
            row.revision !== input.revision ||
            row.state_json === null ||
            BigInt(row.revision) >= maxRevision
          )
            throw new CollaborationError("conflict")

          try {
            boundedState(row.state_json, row.schema_version, () => true)
          } catch (error) {
            check()
            throw new CollaborationError(
              error instanceof DocumentError && error.code === "budget"
                ? "budget"
                : "invalid",
            )
          }

          check()

          const bytes = await input.initialize({
            state: row.state_json,
            schemaVersion: row.schema_version,
            signal,
          })

          const state = candidateState(emptyState, bytes)
          const revision = String(BigInt(row.revision) + 1n)
          await authorize()
          await query(
            "UPDATE editor_documents SET mode='yjs',revision=revision+1 WHERE document_id=$1",
            [input.documentId],
          )
          await query(
            "INSERT INTO editor_collaboration_heads(document_id,generation,revision,state) VALUES($1,$2,$3,$4)",
            [input.documentId, row.generation, revision, state],
          )

          return { generation: row.generation, revision, state }
        },
      )
    },
    async load(documentId: string, context: CollaborationContext) {
      return await execute(
        documentId,
        context,
        "collab:read",
        false,
        async function loadHead(query, authorize) {
          const head = await current(query, documentId)
          const state = candidateState(emptyState, head.state)
          await authorize()

          return { ...head, state }
        },
      )
    },
    async append(
      input: {
        documentId: string
        generation: string
        revision: string
        operationId: string
        update: Uint8Array
      },
      context: CollaborationContext,
    ) {
      expected(input.generation, input.revision)

      if (
        !operation.safeParse(input.operationId).success ||
        !(input.update instanceof Uint8Array) ||
        input.update.length < 2 ||
        input.update.length > 61440
      )
        throw new CollaborationError("invalid")
      const update = input.update.slice()

      return await execute(
        input.documentId,
        context,
        "collab:write",
        true,
        async function appendUpdate(query, authorize) {
          const head = await current(query, input.documentId)

          if (head.generation !== input.generation)
            throw new CollaborationError("conflict")
          const hash = await digest(update)

          const receipts = await query(
            "SELECT revision::text,base_revision::text,operation_id,digest,update_bytes FROM editor_collaboration_updates WHERE document_id=$1 AND generation=$2 AND operation_id=$3",
            [input.documentId, input.generation, input.operationId],
          )

          if (receipts.length) {
            if (receipts.length !== 1) throw new CollaborationError("corrupt")
            const receipt = updateRow.parse(receipts[0])

            if (
              receipt.digest !== hash ||
              receipt.base_revision !== input.revision
            )
              throw new CollaborationError("conflict")
            await authorize()

            return { revision: receipt.revision }
          }

          if (
            head.revision !== input.revision ||
            BigInt(head.revision) >= maxRevision
          )
            throw new CollaborationError("conflict")

          const budget = await query(
            "SELECT count(*)::text AS count,coalesce(sum(octet_length(update_bytes)),0)::text AS bytes FROM editor_collaboration_updates WHERE document_id=$1 AND generation=$2",
            [input.documentId, input.generation],
          )

          const used = z
            .object({
              count: z.string().regex(/^[0-9]+$/),
              bytes: z.string().regex(/^[0-9]+$/),
            })
            .parse(budget[0])

          if (
            BigInt(used.count) >= 256n ||
            BigInt(used.bytes) + BigInt(update.length) > 1048576n
          )
            throw new CollaborationError("budget")
          const state = candidateState(head.state, update)
          const revision = String(BigInt(head.revision) + 1n)
          await authorize()
          await query(
            "UPDATE editor_documents SET revision=revision+1 WHERE document_id=$1",
            [input.documentId],
          )
          await query(
            "UPDATE editor_collaboration_heads SET revision=$2,state=$3 WHERE document_id=$1",
            [input.documentId, revision, state],
          )
          await query(
            "INSERT INTO editor_collaboration_updates(document_id,generation,revision,base_revision,operation_id,digest,update_bytes) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [
              input.documentId,
              input.generation,
              revision,
              input.revision,
              input.operationId,
              hash,
              update,
            ],
          )

          return { revision }
        },
      )
    },
    async poll(
      input: { documentId: string; generation: string; afterRevision: string },
      context: CollaborationContext,
    ) {
      expected(input.generation, input.afterRevision)

      return await execute(
        input.documentId,
        context,
        "collab:read",
        false,
        async function pollUpdates(query, authorize) {
          const head = await current(query, input.documentId)

          if (
            head.generation !== input.generation ||
            BigInt(input.afterRevision) < 2n ||
            BigInt(input.afterRevision) > BigInt(head.revision)
          )
            throw new CollaborationError("conflict")

          const rows = await query(
            "SELECT revision::text,base_revision::text,operation_id,digest,update_bytes FROM editor_collaboration_updates WHERE document_id=$1 AND generation=$2 AND revision>$3 ORDER BY revision LIMIT 16",
            [input.documentId, input.generation, input.afterRevision],
          )

          const entries = rows.map((row) => updateRow.parse(row))
          let previous = BigInt(input.afterRevision)

          for (const entry of entries) {
            if (
              BigInt(entry.revision) !== previous + 1n ||
              entry.update_bytes.length > 61440
            )
              throw new CollaborationError("corrupt")
            previous++
          }

          if (!entries.length && input.afterRevision !== head.revision)
            throw new CollaborationError("corrupt")
          await authorize()

          return entries.map((entry) => ({
            revision: entry.revision,
            operationId: entry.operation_id,
            update: entry.update_bytes.slice(),
          }))
        },
      )
    },
  }
}
