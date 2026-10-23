import type {
  DocumentConfig,
  DocumentContext,
  DocumentDriver,
  DocumentMutation,
  DocumentResult,
  JsonValue,
} from "./document-model"

import {
  boundedState,
  canonical,
  decodeRecord,
  documentId,
  DocumentError,
  maxRevision,
  parseExpected,
  randomToken,
} from "./document-model"
import {
  callableSchema,
  identitySchema,
  mutationSchema,
  receiptSchema,
  rowSchema,
} from "./document-validation"

export async function documentDigest(value: JsonValue) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(value)),
  )

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
}

export async function withinSignal<T>(work: Promise<T>, signal: AbortSignal) {
  let listener: (() => void) | undefined

  const cancelled = new Promise<never>((_resolve, reject) => {
    listener = function abort() {
      reject(new DocumentError("aborted"))
    }

    signal.addEventListener("abort", listener, { once: true })

    if (signal.aborted) listener()
  })

  try {
    return await Promise.race([work, cancelled])
  } finally {
    if (listener) signal.removeEventListener("abort", listener)
  }
}

export function createDocumentService(
  driver: DocumentDriver,
  config: DocumentConfig,
) {
  if (
    !callableSchema.safeParse(config.policy).success ||
    !callableSchema.safeParse(config.validateState).success ||
    !Number.isSafeInteger(config.maxConcurrent) ||
    config.maxConcurrent < 1 ||
    config.maxConcurrent > 64 ||
    !Number.isSafeInteger(config.timeoutMs) ||
    config.timeoutMs < 1 ||
    config.timeoutMs > 30000
  )
    throw new DocumentError("invalid")
  let active = 0
  let pending = 0

  async function track<T>(promise: Promise<T>) {
    pending++

    try {
      return await promise
    } finally {
      pending--
    }
  }

  async function run<T>(
    id: string,
    context: DocumentContext,
    action: "document:read" | "document:write" | "document:delete",
    work: (
      signal: AbortSignal,
      checkDeadline: (uncertain?: boolean) => void,
      deadline: number,
    ) => Promise<T>,
  ) {
    documentId(id)

    if (
      !identitySchema.safeParse(context.identity).success ||
      !Number.isSafeInteger(context.deadline)
    )
      throw new DocumentError("invalid")

    if (context.signal.aborted || context.deadline <= Date.now())
      throw new DocumentError("aborted")

    if (Math.max(active, pending) >= config.maxConcurrent)
      throw new DocumentError("budget")
    active++
    const timer = new AbortController()

    const deadline = Math.min(context.deadline, Date.now() + config.timeoutMs)
    const handle = setTimeout(() => timer.abort(), deadline - Date.now())

    const signal = AbortSignal.any([context.signal, timer.signal])

    function checkDeadline(uncertain = false) {
      if (Date.now() >= deadline) timer.abort()

      if (signal.aborted)
        throw new DocumentError(uncertain ? "uncertain" : "aborted")
    }

    try {
      let decision: unknown

      try {
        decision = await withinSignal(
          track(
            config.policy({
              identity: context.identity,
              documentId: id,
              action,
              signal,
            }),
          ),
          signal,
        )
      } catch {
        throw new DocumentError(signal.aborted ? "aborted" : "unavailable")
      }

      checkDeadline()

      if (decision !== true)
        throw new DocumentError(decision === false ? "denied" : "unavailable")

      return await work(signal, checkDeadline, deadline)
    } catch (error) {
      if (error instanceof DocumentError) throw error
      throw new DocumentError(signal.aborted ? "aborted" : "unavailable")
    } finally {
      clearTimeout(handle)
      active--
    }
  }

  return {
    read(id: string, context: DocumentContext) {
      return run(
        id,
        context,
        "document:read",
        async function read(signal, checkDeadline, deadline) {
          checkDeadline()

          const rows = await withinSignal(
            track(driver.read(id, signal, deadline)),
            signal,
          )

          checkDeadline()

          if (rows.length > 1) throw new DocumentError("corrupt")

          if (!rows.length) return null
          const record = decodeRecord(rowSchema.parse(rows[0]), config)

          if (record.documentId !== id) throw new DocumentError("corrupt")
          checkDeadline()

          return record
        },
      )
    },
    mutate(
      input: DocumentMutation,
      context: DocumentContext,
    ): Promise<DocumentResult> {
      if (!mutationSchema.safeParse(input).success)
        return Promise.reject(new DocumentError("invalid"))

      return run(
        input.documentId,
        context,
        input.change.kind === "delete" ? "document:delete" : "document:write",
        async function mutate(signal, checkDeadline, deadline) {
          const expected = parseExpected(input.expected)

          if (input.change.kind === "delete" && !expected.generation)
            throw new DocumentError("invalid")

          const state =
            input.change.kind === "save"
              ? boundedState(
                  input.change.state,
                  input.change.schemaVersion,
                  (value, version) => config.validateState(value, version),
                )
              : null

          const stateJson = state === null ? null : canonical(state)

          if (
            stateJson !== null &&
            new TextEncoder().encode(stateJson).length > 1048576
          )
            throw new DocumentError("budget")

          checkDeadline()

          const digest = await documentDigest({
            actor: {
              provider: context.identity.provider,
              userId: context.identity.userId,
            },
            documentId: input.documentId,
            expected:
              input.expected.kind === "absent" ? "absent" : input.expected.etag,
            kind: input.change.kind,
            schemaVersion:
              input.change.kind === "save" ? input.change.schemaVersion : null,
            state,
          })

          checkDeadline()

          const current = await withinSignal(
            track(driver.read(input.documentId, signal, deadline)),
            signal,
          )

          if (current.length > 1) throw new DocumentError("corrupt")

          if (current.length) {
            const head = decodeRecord(rowSchema.parse(current[0]), config)

            if (head.documentId !== input.documentId)
              throw new DocumentError("corrupt")
          }

          const prepared = {
            documentId: input.documentId,
            operationId: input.operationId,
            expectedGeneration: expected.generation,
            expectedRevision: expected.revision,
            generation: expected.generation ?? randomToken(),
            marker: randomToken(),
            digest,
            state: stateJson,
            schemaVersion:
              input.change.kind === "save" ? input.change.schemaVersion : 1,
            deleted: input.change.kind === "delete" ? 1 : 0,
          }

          let output: Awaited<ReturnType<DocumentDriver["mutate"]>>
          checkDeadline()

          try {
            output = await withinSignal(
              track(driver.mutate(prepared, signal, deadline)),
              signal,
            )
          } catch (error) {
            if (
              error instanceof DocumentError &&
              error.code === "operation-reuse"
            )
              throw error
            throw new DocumentError("uncertain")
          }

          checkDeadline(true)

          if (output.receipt.length > 1 || output.head.length > 1)
            throw new DocumentError("corrupt")
          const receipt = output.receipt[0]

          if (receipt !== undefined) {
            const parsedReceipt = receiptSchema.safeParse(receipt)

            if (!parsedReceipt.success) throw new DocumentError("corrupt")

            if (parsedReceipt.data.request_digest !== digest)
              throw new DocumentError("operation-reuse")
            const record = decodeRecord(receiptSchema.parse(receipt), config)

            if (record.documentId !== input.documentId)
              throw new DocumentError("corrupt")

            checkDeadline(true)

            return { status: "committed", record }
          }

          if (output.head.length) {
            const head = decodeRecord(rowSchema.parse(output.head[0]), config)

            if (head.documentId !== input.documentId)
              throw new DocumentError("corrupt")

            if (
              head.generation === expected.generation &&
              head.revision === expected.revision &&
              BigInt(head.revision) === maxRevision
            )
              throw new DocumentError("exhausted")
          }

          checkDeadline(true)

          return { status: "conflict" }
        },
      )
    },
  }
}
