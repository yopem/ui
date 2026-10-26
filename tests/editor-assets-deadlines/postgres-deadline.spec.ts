import type { AssetConfig } from "@editor/server/asset-model"
import type { AuthenticationResult } from "@editor/server/auth"
import type {
  DocumentPgClient,
  DocumentPgPool,
} from "@editor/server/document-postgres"

import { createAssetHttpHandler } from "@editor/server/asset-http"
import { AssetError } from "@editor/server/asset-model"
import { createPostgresAssetRepository } from "@editor/server/asset-repository"
import { expect, test } from "bun:test"
import { rejects } from "node:assert/strict"

const generation = "b".repeat(64)

const attemptId = "a".repeat(64)

test("expired repository deadline opens no PostgreSQL connection", async () => {
  let connects = 0

  const pool: DocumentPgPool = {
    connect() {
      connects++

      return Promise.reject(new Error("unexpected-connect"))
    },
  }

  const repository = createPostgresAssetRepository(pool, {
    timeoutMs: 1000,
    maxConcurrent: 1,
  })

  await rejects(
    repository.head("tenant:deadline", {
      signal: new AbortController().signal,
      deadline: Date.now() - 1,
    }),
    AssetError,
  )
  expect(connects).toBe(0)
})

test("a blocking expired query prevents later SQL dispatch", async () => {
  const calls: string[] = []
  let released = false

  const pool: DocumentPgPool = {
    connect(): Promise<DocumentPgClient> {
      return Promise.resolve({
        query(query) {
          calls.push(query.text)

          if (query.text === "BEGIN") {
            const end = Date.now() + 70

            while (Date.now() < end) Math.sqrt(Date.now())
          }

          return Promise.resolve({ rows: [] })
        },
        release(destroy) {
          released = destroy === true
        },
      })
    },
  }

  const repository = createPostgresAssetRepository(pool, {
    timeoutMs: 1000,
    maxConcurrent: 1,
  })

  await rejects(
    repository.head("tenant:deadline", {
      signal: new AbortController().signal,
      deadline: Date.now() + 50,
    }),
    AssetError,
  )

  expect(calls).toEqual(["BEGIN"])
  expect(released).toBe(true)
})

test("cancelled pool wait releases a late client as broken", async () => {
  const connection = Promise.withResolvers<DocumentPgClient>()
  const started = Promise.withResolvers<void>()
  const released = Promise.withResolvers<void>()
  const releases: boolean[] = []
  let queries = 0

  const pool: DocumentPgPool = {
    connect() {
      started.resolve()

      return connection.promise
    },
  }

  const repository = createPostgresAssetRepository(pool, {
    timeoutMs: 1000,
    maxConcurrent: 1,
  })

  const controller = new AbortController()

  const operation = repository.head("tenant:deadline", {
    signal: controller.signal,
    deadline: Date.now() + 5000,
  })

  await started.promise
  controller.abort()
  await rejects(operation, AssetError)

  connection.resolve({
    query() {
      queries++

      return Promise.resolve({ rows: [] })
    },
    release(destroy) {
      releases.push(destroy ?? false)
      released.resolve()
    },
  })
  await released.promise

  expect(queries).toBe(0)
  expect(releases).toEqual([true])
})

test("PostgreSQL query and statement timeouts use remaining deadline", async () => {
  type QueryConfig = Parameters<DocumentPgClient["query"]>[0]

  const calls: QueryConfig[] = []
  const deadline = Date.now() + 5000
  const releases: boolean[] = []

  const pool: DocumentPgPool = {
    connect(): Promise<DocumentPgClient> {
      return Promise.resolve({
        async query(query) {
          calls.push(query)

          if (query.text === "SELECT pg_advisory_xact_lock(784632190)")
            await Bun.sleep(20)

          return { rows: [] }
        },
        release(destroy) {
          releases.push(destroy ?? false)
        },
      })
    },
  }

  const repository = createPostgresAssetRepository(pool, {
    timeoutMs: 3000,
    maxConcurrent: 1,
  })

  expect(
    await repository.head("tenant:deadline", {
      signal: new AbortController().signal,
      deadline,
    }),
  ).toBeNull()

  expect(releases).toEqual([false])

  const settings = calls.filter((query) =>
    query.text.startsWith("SELECT set_config('statement_timeout'"),
  )

  expect(settings.length).toBeGreaterThan(1)
  expect(Number(settings.at(-1)?.values[0])).toBeLessThan(
    Number(settings[0]?.values[0]),
  )
  expect(calls.at(-1)?.query_timeout).toBeLessThan(calls[0]?.query_timeout ?? 0)
})

test("cancellation during COMMIT is uncertain and never dispatches ROLLBACK", async () => {
  type QueryConfig = Parameters<DocumentPgClient["query"]>[0]

  const commitStarted = Promise.withResolvers<void>()
  const commitResult = Promise.withResolvers<{ rows: unknown[] }>()
  const calls: string[] = []
  const releases: boolean[] = []

  const pool: DocumentPgPool = {
    connect(): Promise<DocumentPgClient> {
      return Promise.resolve({
        query(query: QueryConfig) {
          calls.push(query.text)

          if (query.text === "COMMIT") {
            commitStarted.resolve()

            return commitResult.promise
          }

          return Promise.resolve({ rows: [] })
        },
        release(destroy) {
          releases.push(destroy ?? false)
        },
      })
    },
  }

  const repository = createPostgresAssetRepository(pool, {
    timeoutMs: 3000,
    maxConcurrent: 1,
  })

  const controller = new AbortController()

  const operation = repository.head("tenant:deadline", {
    signal: controller.signal,
    deadline: Date.now() + 5000,
  })

  await commitStarted.promise
  controller.abort()
  await rejects(operation, AssetError)
  expect(calls).not.toContain("ROLLBACK")
  expect(releases).toEqual([true])
  commitResult.resolve({ rows: [] })
})

test("cleanup stops before acknowledgement when deletion exceeds its deadline", async () => {
  let claimDeadline: number | undefined
  let acknowledgements = 0

  const repository: AssetConfig["repository"] = {
    head() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
    reserve() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
    read() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
    promote() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
    terminal() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
    remove() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
    claim(_now, _limit, _leaseMs, operation) {
      claimDeadline = operation?.deadline

      return Promise.resolve([
        {
          asset_id: "11111111-1111-4111-8111-111111111111",
          attempt_id: attemptId,
          document_id: "tenant:deadline",
          generation,
          object_key: `editor-attempts/${attemptId}`,
          status: "terminal",
          reserved_bytes: 1,
          byte_size: 0,
          media_type: "image/png",
          media_kind: "image",
          safe_name: "asset.png",
          sha256: "",
          lease_until: 0,
          next_probe_at: 0,
          claim_token: "claim",
          created_at: 1,
        },
      ])
    },
    ack() {
      acknowledgements++

      return Promise.resolve(true)
    },
    key() {
      return Promise.reject(new Error("Unexpected dispatch"))
    },
  }

  const config: AssetConfig = {
    repository,
    objects: {
      put() {
        return Promise.reject(new Error("Unexpected dispatch"))
      },
      get() {
        return Promise.reject(new Error("Unexpected dispatch"))
      },
      delete() {
        const end = Date.now() + 70

        while (Date.now() < end) Math.sqrt(Date.now())

        return Promise.resolve()
      },
      list() {
        return Promise.reject(new Error("Unexpected dispatch"))
      },
    },
    authenticate() {
      return Promise.resolve<AuthenticationResult>({
        status: "unauthenticated",
      })
    },
    policy() {
      return Promise.resolve(false)
    },
    verifyCsrf() {
      return Promise.resolve(false)
    },
    validateImage() {
      return Promise.resolve(false)
    },
    allowedOrigins: ["https://app.example"],
    maxConcurrent: 1,
    timeoutMs: 1000,
    maxFileBytes: 1024,
    maxTotalBytes: 1024,
    maxAttempts: 10,
    maxPending: 1,
    cleanupIntervalMs: 1000,
  }

  const service = createAssetHttpHandler(config)
  const deadline = Date.now() + 50

  await rejects(
    service.cleanup({
      batchSize: 1,
      signal: new AbortController().signal,
      deadline,
    }),
    AssetError,
  )

  expect(claimDeadline).toBe(deadline)
  expect(acknowledgements).toBe(0)
})
