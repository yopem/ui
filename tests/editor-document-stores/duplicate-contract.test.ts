import type {
  DocumentConfig,
  DocumentContext,
  DocumentDriver,
  DocumentMutation,
} from "@editor/server/document-model"

import { createDocumentHttpHandler } from "@editor/server/document-http"
import { createDocumentService } from "@editor/server/document-service"
import { expect, test } from "bun:test"

async function rejection(work: Promise<unknown>) {
  try {
    await work
  } catch (error) {
    if (error instanceof Error) return error
    throw new Error("Non-error rejection")
  }

  throw new Error("Expected rejection")
}

const valid = '{"root":{"type":"root","children":[]}}'

const duplicate = '{"root":{"type":"root","children":[],"t\\u0079pe":"root"}}'

const generation = "a".repeat(64)

const etag = `"${generation}:1"`

const documentId = "app:contract"

function context(): DocumentContext {
  return {
    identity: { provider: "openauth", userId: "user" },
    signal: new AbortController().signal,
    deadline: Date.now() + 5000,
  }
}

function config(): DocumentConfig {
  return {
    policy: () => Promise.resolve(true),
    validateState: () => true,
    timeoutMs: 1000,
    maxConcurrent: 2,
  }
}

function mutation(): DocumentMutation {
  return {
    documentId,
    operationId: "operation12345678",
    expected: { kind: "etag", etag },
    change: { kind: "save", schemaVersion: 1, state: valid },
  }
}

function row(state = valid) {
  return {
    document_id: documentId,
    generation,
    revision: "1",
    mode: "snapshot",
    state_json: state,
    schema_version: 1,
    deleted: 0,
  }
}

function handler(
  service: ReturnType<typeof createDocumentService>,
  allowed = true,
) {
  return createDocumentHttpHandler({
    origin: "https://editor.example",
    basePath: "/documents/",
    service,
    authenticate: () =>
      Promise.resolve({
        status: "authenticated",
        identity: context().identity,
      }),
    policy: () => allowed,
    verifyCsrf: () => true,
    timeoutMs: 1000,
    maxConcurrent: 2,
  })
}

function request(method = "PUT") {
  const init: RequestInit = {
    method,
    headers:
      method === "GET"
        ? {}
        : {
            origin: "https://editor.example",
            "x-csrf-token": "token",
            "content-type": "application/json",
            "if-match": etag,
            "idempotency-key": mutation().operationId,
          },
  }

  if (method === "PUT") init.body = `{"schemaVersion":1,"state":${valid}}`

  return new Request(`https://editor.example/documents/${documentId}`, init)
}

async function safe(
  response: Response,
  status: number,
  body: { error: string; retry?: string },
) {
  expect(response.status).toBe(status)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  expect(response.headers.get("etag")).toBeNull()
  expect(await response.json()).toEqual(body)
}

test("stored duplicate heads fail before dispatch and authorization hides data", async () => {
  let writes = 0
  const stored = row(duplicate)

  const service = createDocumentService(
    {
      read: () => Promise.resolve([stored]),
      mutate: () => {
        writes++

        return Promise.resolve({ receipt: [], head: [] })
      },
    },
    config(),
  )

  expect(await rejection(service.read(documentId, context()))).toMatchObject({
    code: "corrupt",
  })
  expect(await rejection(service.mutate(mutation(), context()))).toMatchObject({
    code: "corrupt",
  })
  expect(
    await rejection(
      service.mutate({ ...mutation(), change: { kind: "delete" } }, context()),
    ),
  ).toMatchObject({ code: "corrupt" })
  await safe(await handler(service)(request("GET")), 503, {
    error: "unavailable",
  })
  await safe(await handler(service)(request()), 503, { error: "unavailable" })
  await safe(await handler(service, false)(request()), 403, {
    error: "request-rejected",
  })
  expect(writes).toBe(0)
  expect(stored.state_json).toBe(duplicate)
})

test("receipt identity and digest take precedence over corrupt snapshot without leaking untrusted rows", async () => {
  let digest = ""
  let variant = "matching"

  const driver: DocumentDriver = {
    read: () => Promise.resolve([row()]),
    mutate(input) {
      digest = input.digest

      const receipt = {
        ...row(duplicate),
        request_digest: variant === "mismatch" ? "b".repeat(64) : digest,
      }

      if (variant === "wrong-id") receipt.document_id = "app:other"

      if (variant === "bad-digest") receipt.request_digest = "bad"

      return Promise.resolve({ receipt: [receipt], head: [row()] })
    },
  }

  const service = createDocumentService(driver, config())
  expect(await rejection(service.mutate(mutation(), context()))).toMatchObject({
    code: "uncertain",
  })
  await safe(await handler(service)(request()), 503, {
    error: "uncertain",
    retry: "same-operation",
  })
  variant = "mismatch"
  expect(await rejection(service.mutate(mutation(), context()))).toMatchObject({
    code: "operation-reuse",
  })
  await safe(await handler(service)(request()), 409, {
    error: "operation-reuse",
  })
  variant = "wrong-id"
  expect(await rejection(service.mutate(mutation(), context()))).toMatchObject({
    code: "uncertain",
  })
  variant = "bad-digest"
  expect(await rejection(service.mutate(mutation(), context()))).toMatchObject({
    code: "uncertain",
  })
  expect(digest).toMatch(/^[0-9a-f]{64}$/)
})

test("post-dispatch invalid rows and result shapes are uncertain; valid conflict remains conflict", async () => {
  const outputs: { receipt: unknown[]; head: unknown[] }[] = [
    { receipt: [], head: [row(duplicate)] },
    { receipt: [{ ...row(), request_digest: "invalid" }], head: [] },
    { receipt: [row(), row()], head: [] },
    { receipt: [], head: [row(), row()] },
  ]

  for (const output of outputs) {
    const service = createDocumentService(
      {
        read: () => Promise.resolve([]),
        mutate: () => Promise.resolve(output),
      },
      config(),
    )

    expect(
      await rejection(service.mutate(mutation(), context())),
    ).toMatchObject({
      code: "uncertain",
    })
  }

  const service = createDocumentService(
    {
      read: () => Promise.resolve([]),
      mutate: () => Promise.resolve({ receipt: [], head: [row()] }),
    },
    config(),
  )

  expect(await service.mutate(mutation(), context())).toEqual({
    status: "conflict",
  })
})

for (const phase of ["input", "read", "head", "receipt", "conflict"] as const) {
  test(`deadline wins when ${phase} validation fails`, async () => {
    let calls = 0
    let writes = 0
    const settings = config()
    settings.timeoutMs = 30
    settings.validateState = () => {
      calls++
      const target = phase === "input" || phase === "read" ? 1 : 2

      if (calls === target) {
        const end = Date.now() + 60

        while (Date.now() < end) Math.sqrt(Date.now())

        return false
      }

      return true
    }

    const service = createDocumentService(
      {
        read: () =>
          Promise.resolve(phase === "head" || phase === "read" ? [row()] : []),
        mutate(input) {
          writes++

          return Promise.resolve({
            receipt:
              phase === "receipt"
                ? [{ ...row(), request_digest: input.digest }]
                : [],
            head: phase === "conflict" ? [row()] : [],
          })
        },
      },
      settings,
    )

    const result =
      phase === "read"
        ? service.read(documentId, context())
        : service.mutate(mutation(), context())

    expect(await rejection(result)).toMatchObject({
      code:
        phase === "receipt" || phase === "conflict" ? "uncertain" : "aborted",
    })
    expect(writes).toBe(phase === "receipt" || phase === "conflict" ? 1 : 0)
  })
}
