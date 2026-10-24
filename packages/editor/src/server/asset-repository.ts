import { z } from "zod"

import type { DocumentD1Binding } from "./document-d1"
import type { DocumentPgPool } from "./document-postgres"

import { AssetError, integer } from "./asset-model"
import { randomToken } from "./document-model"
import { withinSignal } from "./document-service"
import { postgresSql } from "./document-sql"

const rowSchema = z.object({
  asset_id: z.uuid(),
  attempt_id: z.string().regex(/^[a-f0-9]{64}$/),
  document_id: z.string(),
  generation: z.string().regex(/^[a-f0-9]{64}$/),
  object_key: z.string().regex(/^editor-attempts\/[a-f0-9]{64}$/),
  status: z.enum(["pending", "ready", "terminal"]),
  reserved_bytes: z.coerce.number().int().positive().max(10485760),
  byte_size: z.coerce.number().int().min(0).max(10485760),
  media_type: z
    .string()
    .max(127)
    .regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/),
  media_kind: z.enum(["image", "audio", "video", "file"]),
  safe_name: z.string().max(128),
  sha256: z.string(),
  lease_until: z.coerce.number().int().nonnegative().safe(),
  next_probe_at: z.coerce.number().int().nonnegative().safe(),
  claim_token: z.string(),
  created_at: z.coerce.number().int().positive().safe(),
})

export type AssetRow = z.infer<typeof rowSchema>

type Value = string | number | null

interface Statement {
  text: string
  values: Value[]
}

export interface AssetOperation {
  signal: AbortSignal
  deadline: number
}

type Execute = (
  statements: Statement[],
  operation?: AssetOperation,
) => Promise<unknown[][]>

const live =
  "EXISTS (SELECT 1 FROM editor_documents d WHERE d.document_id=editor_assets.document_id AND d.generation=editor_assets.generation AND d.deleted=0 AND d.mode IN ('snapshot','yjs'))"

const snapshot =
  "EXISTS (SELECT 1 FROM editor_documents d WHERE d.document_id=editor_assets.document_id AND d.generation=editor_assets.generation AND d.deleted=0 AND d.mode='snapshot')"

function rows(values: unknown[]) {
  const result = z.array(rowSchema).safeParse(values)

  if (!result.success) throw new AssetError(503, "corrupt")

  return result.data
}

function checkOperation(operation?: AssetOperation) {
  if (!operation) return

  if (
    !Number.isSafeInteger(operation.deadline) ||
    operation.deadline < 1 ||
    !(operation.signal instanceof AbortSignal)
  )
    throw new AssetError(400, "budget")

  operation.signal.throwIfAborted()

  if (Date.now() >= operation.deadline) throw new AssetError(503, "deadline")
}

function createRepository(execute: Execute, databaseTime: string) {
  async function query(
    text: string,
    values: Value[] = [],
    operation?: AssetOperation,
  ) {
    const results = await execute([{ text, values }], operation)
    const first = results[0]

    if (!first) throw new AssetError(503, "repository")

    return first
  }

  return {
    async reserve(
      input: {
        documentId: string
        generation: string
        assetId: string
        attemptId: string
        mediaType: string
        mediaKind?: AssetRow["media_kind"]
        name: string
        now: number
        leaseUntil: number
        bytes: number
        maxBytes: number
        maxAttempts: number
        maxPending: number
      },
      operation?: AssetOperation,
    ) {
      const result = await query(
        `INSERT INTO editor_assets(asset_id,attempt_id,document_id,generation,object_key,status,reserved_bytes,byte_size,media_type,media_kind,safe_name,sha256,lease_until,next_probe_at,claim_token,created_at)
        SELECT ?,?,d.document_id,d.generation,?,'pending',?,0,?,?,?,'',?,0,'',? FROM editor_documents d
        WHERE d.document_id=? AND d.generation=? AND d.deleted=0 AND d.mode='snapshot'
        AND (SELECT COUNT(*) FROM editor_assets) < ?
        AND (SELECT COALESCE(SUM(reserved_bytes),0) FROM editor_assets) <= ?
        AND (SELECT COUNT(*) FROM editor_assets WHERE status='pending') < ? RETURNING *`,
        [
          input.assetId,
          input.attemptId,
          `editor-attempts/${input.attemptId}`,
          input.bytes,
          input.mediaType,
          input.mediaKind ?? "image",
          input.name,
          input.leaseUntil,
          input.now,
          input.documentId,
          input.generation,
          input.maxAttempts,
          input.maxBytes - input.bytes,
          input.maxPending,
        ],
        operation,
      )

      return rows(result)[0] ?? null
    },
    async head(documentId: string, operation?: AssetOperation) {
      const r = await query(
        "SELECT generation FROM editor_documents WHERE document_id=? AND deleted=0 AND mode='snapshot'",
        [documentId],
        operation,
      )

      return (
        z
          .array(z.object({ generation: z.string().regex(/^[a-f0-9]{64}$/) }))
          .parse(r)[0]?.generation ?? null
      )
    },
    async read(
      documentId: string,
      assetId: string,
      operation?: AssetOperation,
    ) {
      return (
        rows(
          await query(
            `SELECT * FROM editor_assets WHERE document_id=? AND asset_id=? AND ${live}`,
            [documentId, assetId],
            operation,
          ),
        )[0] ?? null
      )
    },
    async promote(
      row: AssetRow,
      size: number,
      digest: string,
      now: number,
      operation?: AssetOperation,
    ) {
      return (
        rows(
          await query(
            `UPDATE editor_assets SET status='ready',byte_size=?,sha256=? WHERE asset_id=? AND attempt_id=? AND generation=? AND status='pending' AND lease_until>? AND lease_until>${databaseTime} AND ${snapshot} RETURNING *`,
            [size, digest, row.asset_id, row.attempt_id, row.generation, now],
            operation,
          ),
        )[0] ?? null
      )
    },
    async terminal(attemptId: string, operation?: AssetOperation) {
      await query(
        "UPDATE editor_assets SET status='terminal',next_probe_at=0 WHERE attempt_id=? AND status<>'terminal'",
        [attemptId],
        operation,
      )
    },
    async remove(
      documentId: string,
      assetId: string,
      expires: number,
      operation?: AssetOperation,
    ) {
      return (
        (
          await query(
            `UPDATE editor_assets SET status='terminal',next_probe_at=0 WHERE document_id=? AND asset_id=? AND ${databaseTime} < ? RETURNING *`,
            [documentId, assetId, expires],
            operation,
          )
        ).length === 1
      )
    },
    async claim(
      now: number,
      limit: number,
      leaseMs: number,
      operation?: AssetOperation,
    ) {
      if (
        !integer(now, 1, Number.MAX_SAFE_INTEGER - 30000) ||
        !integer(limit, 1, 100) ||
        !integer(leaseMs, 1, 30000)
      )
        throw new AssetError(400, "invalid")
      const token = randomToken()

      const result = await execute(
        [
          {
            text: `UPDATE editor_assets SET status='terminal',next_probe_at=0 WHERE (status='pending' AND lease_until<=?) OR (status='ready' AND NOT ${live})`,
            values: [now],
          },
          {
            text: "UPDATE editor_assets SET claim_token=?,lease_until=? WHERE attempt_id IN (SELECT attempt_id FROM editor_assets WHERE status='terminal' AND next_probe_at<=? AND (claim_token='' OR lease_until<=?) ORDER BY next_probe_at,attempt_id LIMIT ?) RETURNING *",
            values: [token, now + leaseMs, now, now, limit],
          },
        ],
        operation,
      )

      return rows(result[1] ?? [])
    },
    async ack(
      attemptId: string,
      token: string,
      next: number,
      operation?: AssetOperation,
    ) {
      return (
        (
          await query(
            "UPDATE editor_assets SET claim_token='',lease_until=0,next_probe_at=? WHERE attempt_id=? AND claim_token=? AND status='terminal' RETURNING *",
            [next, attemptId, token],
            operation,
          )
        ).length === 1
      )
    },
    async key(key: string, operation?: AssetOperation) {
      return (
        rows(
          await query(
            "SELECT * FROM editor_assets WHERE object_key=?",
            [key],
            operation,
          ),
        )[0] ?? null
      )
    },
  }
}

export type AssetRepository = ReturnType<typeof createRepository>

export function createD1AssetRepository(binding: DocumentD1Binding) {
  let pending = 0

  return createRepository(async function execute(statements, operation) {
    checkOperation(operation)

    if (pending >= 64) throw new AssetError(429, "budget")
    pending++

    try {
      const session = binding.withSession("first-primary")

      const result = await session.batch(
        statements.map((s) => session.prepare(s.text).bind(...s.values)),
      )

      checkOperation(operation)

      if (
        result.length !== statements.length ||
        result.some((r) => r.success !== true || !Array.isArray(r.results))
      )
        throw new AssetError(503, "repository")

      return result.map((r) => r.results)
    } finally {
      pending--
    }
  }, "CAST(unixepoch('subsec')*1000 AS INTEGER)")
}

export function createPostgresAssetRepository(
  pool: DocumentPgPool,
  options: { timeoutMs: number; maxConcurrent: number },
) {
  if (
    !integer(options.timeoutMs, 1, 30000) ||
    !integer(options.maxConcurrent, 1, 64)
  )
    throw new AssetError(400, "config")
  let pending = 0
  let acquiring = 0

  return createRepository(async function execute(statements, operation) {
    checkOperation(operation)

    const started = Date.now()
    const timeoutDeadline = started + options.timeoutMs

    const deadline = Math.min(
      operation?.deadline ?? timeoutDeadline,
      timeoutDeadline,
    )

    if (deadline <= started) throw new AssetError(503, "deadline")

    if (pending >= options.maxConcurrent || acquiring >= options.maxConcurrent)
      throw new AssetError(429, "budget")

    const controller = new AbortController()

    const signal = operation
      ? AbortSignal.any([operation.signal, controller.signal])
      : controller.signal

    const timer = setTimeout(
      () => controller.abort(),
      Math.min(deadline - Date.now(), 2147483647),
    )

    let client: Awaited<ReturnType<DocumentPgPool["connect"]>> | undefined
    let released = false
    let broken = false
    let began = false
    let commitStarted = false

    function destroy() {
      if (client && !released) {
        released = true
        client.release(true)
      }
    }

    function checkDeadline() {
      signal.throwIfAborted()
      const remaining = deadline - Date.now()

      if (remaining <= 0) throw new AssetError(503, "deadline")

      return remaining
    }

    async function query(text: string, values: Value[] = []) {
      checkDeadline()

      if (!client || released) throw new AssetError(503, "uncertain")

      if (text !== "BEGIN" && text !== "ROLLBACK") {
        await withinSignal(
          client.query({
            text: "SELECT set_config('statement_timeout',$1,true),set_config('lock_timeout',$1,true)",
            values: [String(checkDeadline())],
            query_timeout: checkDeadline(),
          }),
          signal,
        )
        checkDeadline()
      }

      const queryTimeout = checkDeadline()

      if (text === "COMMIT") commitStarted = true

      const result = await withinSignal(
        client.query({ text, values, query_timeout: queryTimeout }),
        signal,
      )

      checkDeadline()

      if (!Array.isArray(result.rows)) throw new AssetError(503, "corrupt")

      return result.rows
    }

    signal.addEventListener("abort", destroy, { once: true })
    pending++
    acquiring++

    const acquisition = Promise.resolve()
      .then(() => {
        checkDeadline()

        return pool.connect()
      })
      .then(function connected(value) {
        client = value

        if (signal.aborted || Date.now() >= deadline) destroy()

        return value
      })
      .finally(function settled() {
        acquiring--
      })

    try {
      await withinSignal(acquisition, signal)
      checkDeadline()
      began = true
      await query("BEGIN")
      await query("SELECT pg_advisory_xact_lock(784632190)")
      const results: unknown[][] = []

      for (const statement of statements)
        results.push(await query(postgresSql(statement.text), statement.values))
      await query("COMMIT")

      return results
    } catch {
      if (commitStarted || signal.aborted || Date.now() >= deadline)
        broken = true
      else if (client && !released && began) {
        try {
          await query("ROLLBACK")
        } catch {
          broken = true
        }
      }

      throw new AssetError(503, "uncertain")
    } finally {
      signal.removeEventListener("abort", destroy)

      if (signal.aborted || Date.now() >= deadline) destroy()

      if (client && !released) {
        released = true
        client.release(broken)
      }

      clearTimeout(timer)
      pending--
    }
  }, "CAST(EXTRACT(EPOCH FROM clock_timestamp())*1000 AS BIGINT)")
}
