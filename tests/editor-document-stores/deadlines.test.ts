import type {
  DocumentConfig,
  DocumentContext,
  DocumentDriver,
  DocumentMutation,
} from "@editor/server/document-model"

import { createDocumentService } from "@editor/server/document-service"
import { expect, test } from "bun:test"

async function rejection<T extends Promise<unknown>>(work: T) {
  try {
    await work
  } catch (error) {
    if (error instanceof Error) return error

    throw new Error("non-Error rejection")
  }

  throw new Error("expected rejection")
}

function block(duration = 70) {
  const end = Date.now() + duration

  while (Date.now() < end) Math.sqrt(Date.now())
}

function context(): DocumentContext {
  return {
    identity: { provider: "openauth", userId: "member" },
    signal: new AbortController().signal,
    deadline: Date.now() + 1000,
  }
}

const state = JSON.stringify({ root: { type: "root", children: [] } })

const row = {
  document_id: "tenant:doc",
  generation: "a".repeat(64),
  revision: "1",
  mode: "snapshot",
  state_json: state,
  schema_version: 1,
  deleted: 0,
}

function mutation(): DocumentMutation {
  return {
    documentId: "tenant:doc",
    operationId: crypto.randomUUID(),
    expected: { kind: "absent" },
    change: { kind: "save", schemaVersion: 1, state },
  }
}

function configuration(): DocumentConfig {
  return {
    policy: () => Promise.resolve(true),
    validateState: () => true,
    timeoutMs: 20,
    maxConcurrent: 1,
  }
}

for (const budget of ["absolute", "timeout"] as const) {
  test(`blocking policy cannot dispatch after ${budget} deadline`, async () => {
    let reads = 0
    let observed: AbortSignal | undefined
    const config = configuration()
    config.timeoutMs = budget === "absolute" ? 1000 : 20
    config.policy = ({ signal }) => {
      observed = signal
      block()

      return Promise.resolve(true)
    }

    const service = createDocumentService(
      {
        read() {
          reads++

          return Promise.resolve([])
        },
        mutate: () => Promise.resolve({ receipt: [], head: [] }),
      },
      config,
    )

    const ctx = context()

    if (budget === "absolute") ctx.deadline = Date.now() + 20
    expect(await rejection(service.read("tenant:doc", ctx))).toMatchObject({
      code: "aborted",
    })
    expect(reads).toBe(0)
    expect(observed?.aborted).toBe(true)
    config.policy = () => Promise.resolve(true)
    expect(await service.read("tenant:doc", context())).toBeNull()
    expect(reads).toBe(1)
  })
}

for (const phase of [
  "input",
  "head",
  "read",
  "receipt",
  "conflict",
  "dispatch",
] as const) {
  test(`blocking ${phase} cannot pass deadline; dispatched writes remain uncertain`, async () => {
    let reads = 0
    let writes = 0
    let validations = 0
    let observed: AbortSignal | undefined
    const config = configuration()
    config.timeoutMs = 200
    config.validateState = () => {
      validations++

      if (
        (phase === "input" && validations === 1) ||
        (phase === "head" && validations === 2) ||
        (phase === "read" && validations === 1) ||
        (phase === "receipt" && validations === 2) ||
        (phase === "conflict" && validations === 2)
      )
        block(350)

      return true
    }

    const driver: DocumentDriver = {
      read(_id, signal) {
        reads++
        observed = signal

        return Promise.resolve(
          phase === "head" || phase === "read" ? [row] : [],
        )
      },
      mutate(input, signal) {
        writes++
        observed = signal

        if (phase === "dispatch") block(350)

        return Promise.resolve({
          receipt:
            phase === "receipt"
              ? [{ ...row, request_digest: input.digest }]
              : [],
          head: phase === "conflict" ? [row] : [],
        })
      },
    }

    const service = createDocumentService(driver, config)

    const result =
      phase === "read"
        ? service.read("tenant:doc", context())
        : service.mutate(mutation(), context())

    expect(await rejection(result)).toMatchObject({
      code: ["receipt", "conflict", "dispatch"].includes(phase)
        ? "uncertain"
        : "aborted",
    })
    expect(reads).toBe(phase === "input" ? 0 : 1)
    expect(writes).toBe(
      ["receipt", "conflict", "dispatch"].includes(phase) ? 1 : 0,
    )

    if (observed) expect(observed.aborted).toBe(true)
  })
}
